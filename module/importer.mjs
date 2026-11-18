/*
 * This file is part of the Tiny Supers system for Foundry VTT.
 *
 * Copyright (C) 2026 dev_null
 *
 * The Tiny Supers system is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The Tiny Supers system is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with the Tiny Supers system. If not, see <https://www.gnu.org/licenses/>.
 */

// -----------------------------------------------------------------------------
// TINY SUPERS IMPORTER
// -----------------------------------------------------------------------------
//
// This class contains the actual import logic used by TinySupersImportApplication.
//
// IMPORTANT DESIGN DECISION:
//
// The importer is deliberately separate from the Application.
//
//     TinySupersImportApplication
//         |
//         | Handles the UI:
//         | - Display the window
//         | - Let the user choose a file
//         | - Tell the importer to process it
//         |
//         v
//     TinySupersImporter
//         |
//         | Handles the data:
//         | - Read the file
//         | - Parse JSON
//         | - Decide what is being imported
//         | - Create Foundry Documents
//         | - Put them into Compendiums
//
// This separation means the importer could eventually be called from
// somewhere other than the import window.
//
// It also makes the code much easier to reason about: the Application deals
// with the USER INTERFACE, while this class deals with the DATA.
export class TinySupersImporter {

  // ===========================================================================
  // MAIN IMPORT ENTRY POINT
  // ===========================================================================
  //
  // This is the method called by TinySupersImportApplication:
  //
  //     await TinySupersImporter.import(file);
  //
  // It is static because we don't need to create an instance of the importer.
  //
  // It is async because reading the file and creating Foundry Documents are
  // asynchronous operations.
  //
  // The method acts as the "dispatcher" for the whole import process.
  //
  // It doesn't actually know how to import traits, archetypes or actors.
  // Instead, it determines which type of data was supplied and passes the
  // appropriate section to a specialised private method.
  static async import(file) {

    // -------------------------------------------------------------------------
    // READ THE FILE
    // -------------------------------------------------------------------------
    //
    // A browser File object has a .text() method which asynchronously reads
    // the contents of the file and returns them as a string.
    //
    // At this point "text" is just JSON text.
    //
    // For example, the file might contain:
    //
    // {
    //   "traits": [
    //     {
    //       "trait": "Flight",
    //       ...
    //     }
    //   ]
    // }
    //
    // It is NOT a JavaScript object yet.
    const text = await file.text();

    // -------------------------------------------------------------------------
    // CONVERT JSON TEXT INTO A JAVASCRIPT OBJECT
    // -------------------------------------------------------------------------
    //
    // JSON.parse() takes the text we just read and converts it into a normal
    // JavaScript object.
    //
    // For example:
    //
    //     '{"traits": [...] }'
    //
    // becomes:
    //
    //     {
    //       traits: [...]
    //     }
    //
    // If the file isn't valid JSON, JSON.parse() throws an error.
    //
    // We aren't catching that error here. That is deliberate for now:
    // the error can propagate back to the Application, where it can
    // eventually be turned into a user-friendly notification.
    const data = JSON.parse(text);

    // -------------------------------------------------------------------------
    // FIND THE ROOT COLLECTION
    // -------------------------------------------------------------------------
    //
    // Our import format deliberately requires the JSON file to have exactly
    // ONE root-level collection.
    //
    // Valid:
    //
    //     {
    //       "traits": [...]
    //     }
    //
    // Also valid:
    //
    //     {
    //       "actors": [...]
    //     }
    //
    // NOT valid:
    //
    //     {
    //       "traits": [...],
    //       "actors": [...]
    //     }
    //
    // The reason for enforcing this is that the importer currently expects
    // one file to represent one type of import.
    //
    // Object.keys(data) returns an array containing the object's top-level
    // property names.
    //
    // For:
    //
    //     { traits: [...] }
    //
    // it returns:
    //
    //     ["traits"]
    const keys = Object.keys(data);

    // There must be exactly one top-level property.
    //
    // This is a deliberate validation step rather than simply assuming the
    // input is correct.
    //
    // If this fails, throw an Error rather than continuing with ambiguous
    // data.
    if (keys.length !== 1) {
      throw new Error("Import file must contain exactly one root collection.");
    }

    // -------------------------------------------------------------------------
    // CHOOSE THE CORRECT IMPORTER
    // -------------------------------------------------------------------------
    //
    // Because we have already established that there is exactly one root
    // property, keys[0] gives us its name.
    //
    // The switch then decides which specialised import method should process
    // the data.
    //
    // This is essentially a dispatcher:
    //
    //     "What did the user give me?"
    //              |
    //        +-----+-----+---------+
    //        |           |         |
    //      traits    archetypes   actors
    //        |           |         |
    //   #importTraits    ...       ...
    //
    // The private methods keep each type of import separate rather than
    // putting all of the document creation logic into one enormous method.
    switch (keys[0]) {

      // Import a collection of Trait Items.
      case "traits":
        await this.#importTraits(data.traits);
        break;

      // Import a collection of Archetype Items.
      case "archetypes":
        await this.#importArchetypes(data.archetypes);
        break;

      // Import a collection of Actor documents.
      case "actors":
        await this.#importActors(data.actors);
        break;

      // If the root collection isn't something we recognise, stop.
      //
      // This is important because otherwise a typo in the JSON could result
      // in an import that silently does nothing.
      default:
        throw new Error(`Unknown collection '${keys[0]}'`);
    }
  }

  // ===========================================================================
  // GET / CREATE THE TRAITS COMPENDIUM
  // ===========================================================================
  //
  // This method implements a useful pattern that is repeated for each type
  // of imported document:
  //
  //     1. Look for the Compendium.
  //     2. If it exists, return it.
  //     3. If it doesn't exist, create it.
  //     4. Return the Compendium.
  //
  // This means the importer can safely be run more than once without trying
  // to create the same Compendium every time.
  //
  // The method is private (#) because it is an implementation detail of the
  // importer. Nothing outside TinySupersImporter needs to know how the
  // Compendium is obtained.
  static async #getTraitsPack() {
    // This is the internal Compendium "name".
    //
    // IMPORTANT:
    // Foundry distinguishes between a Compendium's internal name and its
    // human-readable label.
    //
    //     name:  "tiny-supers-traits"
    //     label: "Tiny Supers - Traits"
    //
    // The name is intended to be a stable identifier.
    const packName = "tiny-supers-traits";

    // -------------------------------------------------------------------------
    // FIND AN EXISTING WORLD COMPENDIUM
    // -------------------------------------------------------------------------
    //
    // game.packs contains the Compendiums currently available to the world.
    //
    // World-owned Compendiums are addressed using the:
    //
    //     world.<packName>
    //
    // namespace.
    //
    // Therefore:
    //
    //     world.tiny-supers-traits
    //
    // means:
    //
    //     "the tiny-supers-traits Compendium belonging to this world."
    //
    // IMPORTANT FOUNDry LESSON:
    //
    // This is why trying something like:
    //
    //     game.packs.get("tiny-supers.traits")
    //
    // didn't work earlier.
    //
    // That is not a valid Compendium identifier for a world-created pack.
    //
    // The namespace here is "world", not our system ID.
    let pack = game.packs.get(`world.${packName}`);

    // If the Compendium already exists, we're finished.
    //
    // Returning it here prevents the rest of the method from creating a
    // duplicate Compendium.
    if (pack) return pack;

    // -------------------------------------------------------------------------
    // CREATE THE COMPENDIUM
    // -------------------------------------------------------------------------
    //
    // If we get here, there isn't already a world Compendium with this name.
    //
    // In Foundry VTT v14 the relevant CompendiumCollection class is accessed
    // through:
    //
    //     foundry.documents.collections.CompendiumCollection
    //
    // rather than relying on the older global API.
    //
    // This was one of the important v14 API changes to learn:
    //
    //     OLD STYLE:
    //         CompendiumCollection
    //
    //     MODERN NAMESPACED API:
    //         foundry.documents.collections.CompendiumCollection
    //
    // Using the namespaced API makes it clear which Foundry class we're
    // actually working with.
    pack = await foundry.documents.collections.CompendiumCollection.createCompendium({
      name: packName,

      // Human-readable name shown to users in Foundry.
      label: "Tiny Supers - Traits",

      // This Compendium will contain Item documents.
      //
      // We are NOT creating a new document type here. "trait" is the Item
      // type defined by the Tiny Supers system.
      type: "Item"
    });

    // Return the newly created Compendium so the caller can use it.
    return pack;
  }

  // ===========================================================================
  // IMPORT TRAITS
  // ===========================================================================
  //
  // "traits" is expected to be an array of plain JavaScript objects obtained
  // from the JSON import file.
  //
  // For example:
  //
  //     [
  //       {
  //         "trait": "Flight",
  //         "trait_desc": "The hero can fly.",
  //         "trait_group": "power"
  //       }
  //     ]
  //
  // The job of this method is to convert those plain JSON objects into the
  // data structure expected by Foundry's Item document system.
  // ===========================================================================
  // UP-SERT DOCUMENTS (UPDATE OR INSERT)
  // ===========================================================================
  //
  // This is the single place where the importer decides, for every document
  // we are about to import, whether to CREATE a new one or UPDATE an
  // existing one.
  //
  // Without this, importing the same JSON file twice would create duplicate
  // Documents in the Compendium.
  //
  // The rule is deliberately simple:
  //
  //     A document is considered "the same" if an existing document in the
  //     destination Compendium has the same name AND the same type.
  //
  //     name + type
  //         ↓
  //     existing?  →  update it
  //     no match?  →  create it
  //
  // This is a "upsert" (update or insert).
  //
  // The method is private (#) because it is an implementation detail of the
  // importer. Nothing outside TinySupersImporter needs to know how the
  // upsert is performed.
  //
  // Why not match on the whole system object?
  //
  //     Matching on name + type is enough for our use case and keeps the
  //     logic easy to reason about. If two different Traits ever shared a
  //     name, the first imported one would be updated rather than a second
  //     one created. That is an acceptable trade-off for now; a stricter
  //     match (for example on a unique source field) could replace this
  //     later without changing the call sites.
  static async #upsertDocuments(pack, documents) {

    // -------------------------------------------------------------------------
    // LOAD THE COMPENDIUM'S EXISTING DOCUMENTS
    // -------------------------------------------------------------------------
    //
    // CompendiumCollection.content is the array of Documents already in the
    // Compendium.
    //
    // We load it once, before the loop, so we don't re-read the Compendium
    // for every document we import.
    const existing = await pack.getDocuments();

    // -------------------------------------------------------------------------
    // WORK OUT WHICH DOCUMENTS TO CREATE AND WHICH TO UPDATE
    // -------------------------------------------------------------------------
    //
    // We build two arrays:
    //
    //     toCreate
    //         Documents with no existing match.
    //
    //     toUpdate
    //         Pairs of [existing document, incoming data], so we can update
    //         the existing document with the incoming values.
    //
    // Separating the work this way lets us distinguish between new documents
    // (which we create) and existing ones (which we update).
    const toCreate = [];
    const toUpdate = [];

    for (const docData of documents) {

      // Find an existing document with the same name AND type.
      //
      // find() returns the first match, or undefined if there is none.
      const match = existing.find(
        existingDoc =>
          existingDoc.name === docData.name &&
          existingDoc.type === docData.type
      );

      if (match) {
        // We already have a document with this name and type.
        //
        // Update it with the incoming values rather than creating a
        // duplicate.
        toUpdate.push([match, docData]);
      } else {
        // No match. Create a new document.
        toCreate.push(docData);
      }
    }

    // -------------------------------------------------------------------------
    // CREATE THE NEW DOCUMENTS
    // -------------------------------------------------------------------------
    //
    // For each document we create it in the world, import it into the
    // Compendium, then delete the world copy.
    //
    // WHY THIS THREE-STEP PATTERN?
    //
    // In Foundry 14.370, CompendiumCollection does NOT have a direct
    // createDocument(data) method that persists raw document data into the
    // pack. The two options that exist are:
    //
    //   1. pack.documentClass.createDocuments(data, { pack })
    //      — silently returns [] when validation fails. No error, no
    //        warning. The import "does nothing".
    //
    //   2. pack.importDocument(document)
    //      — accepts a Document instance and moves it into the Compendium.
    //        This works, but you need a Document to hand it.
    //
    // So the reliable pattern is:
    //
    //   a. Create the Document in the world (Item.create / Actor.create).
    //      This surfaces real validation errors and gives us a Document
    //      instance.
    //
    //   b. Import that Document into the Compendium via
    //      pack.importDocument(doc).
    //
    //   c. Delete the world copy. The Document now lives in the Compendium.
    //
    // Each step is wrapped in a try/catch so that a single bad document
    // doesn't abort the entire import — the user gets a notification naming
    // the failing document and the import continues with the rest.
    //
    // If the import succeeds but the world-delete fails, we still count it
    // as a success (the document is in the Compendium, which is what
    // matters). A stray world document is far less harmful than a missing
    // Compendium document.
    let createdCount = 0;
    let failedCount = 0;

    if (toCreate.length > 0) {
      for (const docData of toCreate) {
        let worldDoc = null;
        try {
          // Step 1: Create the Document in the world.
          //
          // The pack's documentClass tells us whether we're creating
          // Items or Actors, so we call the right create method.
          const docClass = pack.documentClass;
          worldDoc = await docClass.create(docData);
        } catch (err) {
          // The world-creation itself failed (e.g. invalid type, bad
          // schema). Surface the real error.
          failedCount++;
          ui.notifications.error(
            `Failed to import "${docData.name}": ${err.message}`
          );
          continue;
        }

        try {
          // Step 2: Import the world Document into the Compendium.
          await pack.importDocument(worldDoc);

          // Step 3: Delete the world copy.
          //
          // We try this in a separate try/catch because a failure here
          // doesn't mean the import failed — the document is already in
          // the Compendium. We just log a warning so the GM can clean
          // up manually if needed.
          try {
            await worldDoc.delete();
          } catch (delErr) {
            console.warn(
              `tiny-supers: Could not delete world copy of "${worldDoc.name}" after import:`,
              delErr
            );
          }

          createdCount++;
        } catch (err) {
          // The import into the Compendium failed. Clean up the world
          // document so we don't leave strays behind.
          failedCount++;
          ui.notifications.error(
            `Failed to import "${docData.name}": ${err.message}`
          );
          try {
            await worldDoc.delete();
          } catch {
            // Best-effort cleanup. If this also fails, the GM can
            // delete the stray document manually.
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // UPDATE THE EXISTING DOCUMENTS
    // -------------------------------------------------------------------------
    //
    // For each [existing, incomingData] pair we call the existing document's
    // update() method with the incoming data.
    //
    // update() merges the incoming values into the existing document, so any
    // fields not present in the incoming data are left untouched.
    //
    // We loop rather than batch here because each update targets a
    // different document, and Foundry's Document.update() is the natural
    // per-document API.
    let updatedCount = 0;
    for (const [existingDoc, docData] of toUpdate) {
      try {
        await existingDoc.update(docData);
        updatedCount++;
      } catch (err) {
        failedCount++;
        ui.notifications.error(
          `Failed to update "${existingDoc.name}": ${err.message}`
        );
      }
    }

    // -------------------------------------------------------------------------
    // TELL THE USER WHAT HAPPENED
    // -------------------------------------------------------------------------
    //
    // A short summary is useful so the user knows whether the import created
    // new documents, updated existing ones, or both.
    //
    // ui.notifications.info() is Foundry's standard notification system.
    //
    // createdCount and updatedCount reflect documents that SUCCEEDED, not
    // just the ones we attempted.  failedCount tracks errors so the user
    // knows when something went wrong.

    // Build the summary message.
    const parts = [];
    if (createdCount > 0) parts.push(`${createdCount} created`);
    if (updatedCount > 0) parts.push(`${updatedCount} updated`);
    if (failedCount > 0) parts.push(`${failedCount} failed`);

    if (parts.length > 0) {
      ui.notifications.info(`Import complete: ${parts.join(", ")}.`);
    } else {
      ui.notifications.info("Import complete: nothing to do.");
    }
  }

  static async #importTraits(traits) {

    // Get the existing Compendium, or create it if necessary.
    const pack = await this.#getTraitsPack();

    // -------------------------------------------------------------------------
    // CONVERT JSON DATA INTO FOUNDRY DOCUMENT DATA
    // -------------------------------------------------------------------------
    //
    // Array.map() creates a NEW array by transforming every element in the
    // original array.
    //
    // This is an important distinction:
    //
    // The objects in the JSON file are NOT Foundry Documents.
    //
    // They are just ordinary JavaScript objects.
    //
    // We construct new objects containing exactly the fields Foundry needs
    // to create our Item documents.
    //
    // The resulting structure looks roughly like:
    //
    //     {
    //       name: "Flight",
    //       type: "trait",
    //       system: {
    //         trait: "Flight",
    //         trait_desc: "...",
    //         trait_group: "power"
    //       }
    //     }
    //
    // This is document DATA, not yet an actual Item document.
    const documents = traits.map(trait => ({

      // Foundry's standard Document field.
      //
      // Every Item has a name.
      name: trait.trait,

      // This selects the Item's document type.
      //
      // "trait" must correspond to an Item type recognised by the Tiny Supers
      // system/data model.
      type: "trait",

      // The system object contains the fields belonging to our custom
      // Tiny Supers Item data model.
      //
      // This is where the data defined by Traits TypeDataModel ends up.
      system: {
        trait: trait.trait,
        trait_desc: trait.trait_desc,
        trait_group: trait.trait_group
      }
    }));

    // -------------------------------------------------------------------------
    // UPSERT ALL THE ITEMS IN THE COMPENDIUM
    // -------------------------------------------------------------------------
    //
    // #upsertDocuments(...) decides, for each document, whether to CREATE a
    // new one or UPDATE an existing one (matched by name + type).
    //
    // This means importing the same JSON file twice does not create
    // duplicate Items — the second import updates the existing ones.
    //
    // The method also reports a short summary to the user.
    await this.#upsertDocuments(pack, documents);
  }

  // ===========================================================================
  // OLD IMPLEMENTATION
  // ===========================================================================
  //
  // This is the old version that was originally attempted:
  //
  //     Item.create(data, {
  //       pack: "tiny-supers.traits"
  //     });
  //
  // It has deliberately been left here as a reminder of the migration
  // process.
  //
  // There were two separate problems with this approach:
  //
  // 1. The Compendium identifier was wrong.
  //
  //    "tiny-supers.traits" refers to the sort of identifier we might use
  //    for a packaged system/module Compendium, but this importer creates
  //    the Compendium dynamically in the WORLD.
  //
  //    Therefore the identifier is:
  //
  //        world.tiny-supers-traits
  //
  //
  // 2. We were relying on the older global Item API rather than using the
  //    Compendium's documentClass.
  #    The modern approach is:
  //
  //        const doc = await pack.documentClass.create(data);
  //        await pack.importDocument(doc);
  //        await doc.delete();
  //
  //    This three-step pattern (create in world → import into Compendium →
  //    delete world copy) is the only reliable way to persist documents
  //    into a world Compendium in Foundry 14.370. The batched
  //    createDocuments(...) silently returns [] on validation failure, and
  //    CompendiumCollection has no direct createDocument(data) method.
  //
  // This commented code is therefore useful as a record of what DIDN'T work
  // and, more importantly, why.
  /*
      static async #importTraits(data) {

        const pack = await this.#getTraitsPack();

        for (const trait of data) {
          await Item.create(data, {
          pack: "tiny-supers.traits"
          });
        }
      }
  */

  // ===========================================================================
  // GET / CREATE THE ARCHETYPES COMPENDIUM
  // ===========================================================================
  //
  // This is almost identical to #getTraitsPack().
  //
  // It is kept as a separate method because the two Compendiums have
  // different names and labels.
  //
  // If this system grows considerably, these three methods could eventually
  // be refactored into one generic "get or create pack" method. For now,
  // keeping them separate makes the code easier to understand.
  static async #getArchetypesPack() {
    // Internal Compendium name.
    const packName = "tiny-supers-archetypes";

    // Look for an existing world-owned Compendium.
    let pack = game.packs.get(`world.${packName}`);

    // Re-use it if it already exists.
    if (pack) return pack;

    // Otherwise create it.
    //
    // Archetypes are also Item documents in Tiny Supers.
    pack = await foundry.documents.collections.CompendiumCollection.createCompendium({
      name: packName,
      label: "Tiny Supers - Archetypes",
      type: "Item"
    });

    // Give the caller the Compendium.
    return pack;
  }

  // ===========================================================================
  // IMPORT ARCHETYPES
  // ===========================================================================
  //
  // Convert the plain JSON archetype objects into Foundry Item data and
  // create them in the archetypes Compendium.
  static async #importArchetypes(data) {
    // Get or create the destination Compendium.
    const pack = await this.#getArchetypesPack();

    // Convert each JSON archetype into Foundry Item document data.
    const documents = data.map(archetype => ({
      // Standard Foundry Item field.
      name: archetype.archetype,

      // Tiny Supers Item document type.
      type: "archetype",

      // Custom Tiny Supers Item data.
      system: {
        archetype: archetype.archetype,
        archetype_desc: archetype.archetype_desc,
        stress: archetype.stress,
        archetype_trait: archetype.archetype_trait,
        source: archetype.source
      }
    }));

    // Upsert all Archetype Items in the Compendium.
    //
    // Same upsert behaviour as traits: existing archetypes (matched by name
    // + type) are updated, new ones are created.
    await this.#upsertDocuments(pack, documents);
  }

  // ===========================================================================
  // GET / CREATE THE ACTORS COMPENDIUM
  // ===========================================================================
  //
  // Same "get it if it exists, otherwise create it" pattern as the Item
  // Compendiums above.
  //
  // The important difference is that this Compendium contains Actor
  // Documents rather than Item Documents.
  static async #getActorsPack() {
    // Internal Compendium name.
    const packName = "tiny-supers-actors";


    // Look for an existing world-owned Compendium.
    let pack = game.packs.get(`world.${packName}`);

    // Re-use it if it already exists.
    if (pack) return pack;

    // Create the Compendium if necessary.
    //
    // "type: Actor" tells Foundry that the Documents stored here are Actors.
    //
    // Consequently, when we later use:
    //
    //     pack.documentClass
    //
    // it will refer to the Actor document class rather than Item.
    pack = await foundry.documents.collections.CompendiumCollection.createCompendium({
      name: packName,
      label: "Tiny Supers - Pregens",
      type: "Actor"
    });

    return pack;
  }

  // ===========================================================================
  // IMPORT ACTORS
  // ===========================================================================
  //
  // Actors are slightly different from Traits and Archetypes.
  //
  // Traits and Archetypes are custom Item types.
  //
  // Actors are normal Foundry Actor Documents using the Tiny Supers Actor
  // data model.
  static async #importActors(data) {
    // Get or create the destination Compendium.
    const pack = await this.#getActorsPack();

    // -------------------------------------------------------------------------
    // CONVERT JSON ACTORS INTO FOUNDRY ACTOR DATA
    // -------------------------------------------------------------------------
    //
    // Again, these objects are not yet Actors.
    //
    // They are plain JavaScript objects describing the Actor we want Foundry
    // to create.
    //
    // Foundry will validate the data against the Actor's data model when the
    // Documents are created.
    const documents = data.map(actor => ({
      // Standard Actor field.
      name: actor.name,

      // This must match the Actor type registered by the Tiny Supers system.
      //
      // In our system this corresponds to the "hero"/SuperHero Actor data
      // model setup we worked through earlier.
      //
      // IMPORTANT:
      // Make sure this value matches the actual Actor type registered in
      // system.json / CONFIG.Actor.dataModels.
      type: "hero",

      // Custom Tiny Supers Actor data.
      //
      // These names need to match the fields defined by the SuperHero
      // TypeDataModel.
      //
      // NOTE:
      // Traits are no longer fields on the Actor. They are separate Item
      // documents embedded inside the Actor (see the character sheet).
      //
      // The old JSON import format used trait1, trait2 and trait3 fields
      // here. Those fields were removed from the SuperHero data model when
      // traits became Items, so they can no longer be imported as plain
      // system data.
      //
      // If pregen import ever needs to support embedded trait Items, the
      // JSON format would have to change (for example, to include an
      // "items" array per actor) and the import logic would create those
      // Items as embedded documents rather than system fields.
      system: {
        civilianIdentity: actor.civilianIdentity,
        appearance: actor.appearance,
        beliefs: actor.beliefs,
        weakness: actor.weakness,
        archetype: actor.archetype,
        powerOrigin: actor.powerOrigin,
        stress: actor.stress,
        masteredWeapons: actor.masteredWeapons,
        proficientWeapons: actor.proficientWeapons,
        powerLevel: actor.powerLevel,
      }
    }));

    // Upsert all of the Actor Documents in the Compendium.
    //
    // Same upsert behaviour as traits and archetypes: existing pregen
    // actors (matched by name + type) are updated, new ones are created.
    //
    // This also means re-importing the same pregen JSON file does not create
    // duplicate Actor documents in the Pregens Compendium.
    await this.#upsertDocuments(pack, documents);
  }
}