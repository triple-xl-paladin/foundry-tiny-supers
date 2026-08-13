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

// models/actor.mjs
//
// This file defines the DATA MODEL for a Tiny Supers Hero Actor.
//
// IMPORTANT FOUNDry VTT v14 LESSON:
//
// We are NOT creating a new Actor class here.
//
// Foundry already provides the Actor Document itself.
//
// Instead, we are defining the structure of the custom "system" data
// belonging to our Actor type.
//
// The relationship is:
//
//     Foundry Actor Document
//              │
//              └── system
//                    │
//                    ├── civilianIdentity
//                    ├── appearance
//                    ├── beliefs
//                    ├── weakness
//                    ├── powerOrigin
//                    ├── stress
//                    ├── masteredWeapons
//                    ├── proficientWeapons
//                    └── powerLevel
//
// This class tells Foundry what those fields are and what type of data they
// contain.
//
// This is one of the major changes from older Foundry versions/API examples.
// We use a TypeDataModel for the custom Actor data instead of trying to
// replace or subclass the core Actor Document itself.


// -----------------------------------------------------------------------------
// FOUNDRY DATA FIELD CLASSES
// -----------------------------------------------------------------------------
//
// Foundry provides a collection of field classes for defining data schemas.
//
// The fields used here include:
//
//     StringField
//         Text/string data.
//
//     NumberField
//         Numeric data.
//
// There are several other field types available, which are imported here
// because they were considered/used while developing the system.
//
// Currently these models only need StringField and NumberField.
//
// IMPORTANT:
// The fields must come from Foundry's data field system:
//
//     foundry.data.fields
//
// They aren't ordinary JavaScript types such as String or Number.
//
// Using Foundry's field classes allows Foundry to validate, initialise and
// manage the data according to the schema.
const {
  HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;

// -----------------------------------------------------------------------------
// SUPERHERO DATA MODEL
// -----------------------------------------------------------------------------
//
// A TypeDataModel describes the custom "system" data for a particular
// Document type.
//
// This model is intended to be registered as the data model for the Tiny
// Supers Hero Actor type.
//
// IMPORTANT DISTINCTION:
//
//     Actor
//         = Foundry's actual Document
//
//     SuperHero
//         = the schema describing the Actor's custom system data
//
// We therefore don't create Actors by doing:
//
//     new SuperHero()
//
// Instead, Foundry creates normal Actor Documents and uses this model to
// validate/manage their system data.
export class SuperHero extends foundry.abstract.TypeDataModel {

  // ===========================================================================
  // DEFINE THE DATA SCHEMA
  // ===========================================================================
  //
  // Foundry calls defineSchema() when it needs to know what fields this
  // data model contains.
  //
  // The object returned here defines the structure of:
  //
  //     actor.system
  //
  // For example:
  //
  //     actor.system.civilianIdentity
  //
  // is defined by the civilianIdentity field below.
  //
  // This is the modern Foundry data-model approach:
  //
  //     defineSchema()
  //          ↓
  //     defines fields
  //          ↓
  //     Foundry validates/manages actor.system
  //
  // The schema is therefore the single place where we define the structure
  // of the Hero's custom data.
  static defineSchema() {
    return {
      // -----------------------------------------------------------------------
      // CIVILIAN IDENTITY
      // -----------------------------------------------------------------------
      //
      // Normal text field containing the hero's civilian identity.
      //
      // Example:
      //
      //     "Peter Parker"
      //
      // This is a StringField rather than a normal JavaScript string because
      // Foundry needs to know the field's type as part of the data model.
      civilianIdentity: new StringField(),

      // -----------------------------------------------------------------------
      // APPEARANCE
      // -----------------------------------------------------------------------
      //
      // Free-form text describing the character's physical appearance.
      //
      // StringField is sufficient because this is currently just text.
      appearance: new StringField(),

      // -----------------------------------------------------------------------
      // BELIEFS
      // -----------------------------------------------------------------------
      //
      // Free-form text describing the hero's beliefs, motivations or ideals.
      beliefs: new StringField(),

      // -----------------------------------------------------------------------
      // WEAKNESS
      // -----------------------------------------------------------------------
      //
      // Free-form text describing the hero's weakness.
      weakness: new StringField(),

      // -----------------------------------------------------------------------
      // POWER ORIGIN
      // -----------------------------------------------------------------------
      //
      // Text describing where the hero's powers came from.
      //
      // Examples might include:
      //
      //     "Alien"
      //     "Mutation"
      //     "Technology"
      //     "Magic"
      //
      // We are deliberately storing this as a StringField rather than an
      // enumeration because the system currently allows arbitrary values.
      powerOrigin: new StringField(),

      // -----------------------------------------------------------------------
      // STRESS
      // -----------------------------------------------------------------------
      //
      // Stress is numeric, so this uses NumberField rather than StringField.
      //
      // "initial: 0" tells Foundry what value a newly created Actor should
      // receive if no value is supplied.
      //
      // This is an important difference from simply writing:
      //
      //     stress: new NumberField()
      //
      // which would use the field's normal default behaviour.
      stress: new NumberField({ initial: 0 }),

      // -----------------------------------------------------------------------
      // MASTERED WEAPONS
      // -----------------------------------------------------------------------
      //
      // Text describing weapons the character has mastered.
      //
      // This is currently represented as a single StringField rather than
      // an ArrayField.
      //
      // If we eventually need to treat each weapon as a separate piece of
      // data, this could be redesigned as an array or, more appropriately,
      // as embedded Item Documents.
      masteredWeapons: new StringField(),

      // -----------------------------------------------------------------------
      // PROFICIENT WEAPONS
      // -----------------------------------------------------------------------
      //
      // Text describing weapons with which the character is proficient.
      //
      // As with masteredWeapons, this is currently deliberately simple
      // text rather than a structured collection.
      proficientWeapons: new StringField(),

      // -----------------------------------------------------------------------
      // POWER LEVEL
      // -----------------------------------------------------------------------
      //
      // The character's current power level.
      //
      // This is currently stored as a StringField rather than NumberField.
      //
      // If Power Level eventually becomes something that is mathematically
      // manipulated, this might make more sense as a NumberField.
      //
      // For now, keeping it as text gives us flexibility over how the value
      // is represented.
      powerLevel: new StringField()
    };
  }
}
