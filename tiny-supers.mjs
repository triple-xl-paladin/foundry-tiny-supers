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


// tiny-supers.mjs
//
// ============================================================================
// SYSTEM ENTRY POINT
// ============================================================================
//
// This is the main JavaScript entry point for the Tiny Supers Foundry system.
//
// Think of this file as the SYSTEM'S WIRING.
//
// The individual files contain the actual components:
//
//     models/
//         actor.mjs
//         item-archetype-model.mjs
//         item-trait-model.mjs
//
//     actor-sheet.mjs
//         Displays/edits Hero Actors
//
//     item-archetype-sheet.mjs
//         Displays/edits Archetype Items
//
//     item-trait-sheet.mjs
//         Displays/edits Trait Items
//
//     tiny-supers-dice-roller.mjs
//         Provides the dice-rolling UI
//
//     import-application.mjs
//         Provides the JSON import UI
//
// This file brings those components together and tells Foundry:
//
//     "Here are the documents, data models, sheets and applications that
//      make up the Tiny Supers system."
//
// IMPORTANT FOUNDry LESSON:
//
// Most of the registration needs to happen during the "init" hook.
// Foundry is still constructing the game at that point, so this is where
// system-level configuration is normally registered.


// ============================================================================
// IMPORT THE CUSTOM COMPONENTS
// ============================================================================
//
// JavaScript modules allow us to keep the system divided into separate files.
//
// Instead of putting every class into this one file, we import the pieces
// that need to be registered with Foundry.


// -----------------------------------------------------------------------------
// ACTOR SHEET
// -----------------------------------------------------------------------------
//
// Custom ApplicationV2 sheet used to display/edit Tiny Supers Hero Actors.
import { SuperHeroSheet } from './module/actor-sheet.mjs';

// -----------------------------------------------------------------------------
// ACTOR DATA MODEL
// -----------------------------------------------------------------------------
//
// Defines the structure of:
//
//     Actor.system
//
// for Actors whose type is "hero".
//
// IMPORTANT:
//
// This is NOT a replacement Actor Document.
//
// Foundry still uses its normal Actor class. SuperHero is the TypeDataModel
// describing the custom system data for that Actor type.
import { SuperHero } from './module/models/actor.mjs';

// -----------------------------------------------------------------------------
// ARCHETYPE DATA MODEL
// -----------------------------------------------------------------------------
//
// Defines the structure of:
//
//     Item.system
//
// for Items whose type is "archetype".
import { Archetype } from './module/models/item-archetype-model.mjs';

// -----------------------------------------------------------------------------
// TRAIT DATA MODEL
// -----------------------------------------------------------------------------
//
// Defines the structure of:
//
//     Item.system
//
// for Items whose type is "trait".
import { Trait } from './module/models/item-trait-model.mjs';

// -----------------------------------------------------------------------------
// DICE ROLLER APPLICATION
// -----------------------------------------------------------------------------
//
// Standalone ApplicationV2 window providing the Tiny Supers dice-rolling UI.
//
// Unlike the Actor/Item sheets, this isn't associated with a Foundry
// Document. It is simply a utility application.
import { TinySupersDiceRoller } from './module/tiny-supers-dice-roller.mjs'

// -----------------------------------------------------------------------------
// ITEM SHEETS
// -----------------------------------------------------------------------------
//
// Custom ApplicationV2 sheets for our two custom Item types.
import { ItemArchetypeSheet } from './module/item-archetype-sheet.mjs';
import { ItemTraitSheet } from './module/item-trait-sheet.mjs';

// -----------------------------------------------------------------------------
// IMPORT APPLICATION
// -----------------------------------------------------------------------------
//
// Standalone ApplicationV2 window used by the Import Content settings menu.
//
// This application lets an authorised user import JSON data into the world.
import { TinySupersImportApplication } from './module/import-application.mjs';

// ============================================================================
// FOUNDry DOCUMENT COLLECTIONS
// ============================================================================
//
// Foundry provides collections containing all Actors and Items currently
// available in the world.
//
// In older Foundry examples you may see:
//
//     Actors
//     Items
//
// used as globals.
//
// In newer Foundry versions, the classes are namespaced under:
//
//     foundry.documents.collections
//
// This was one of the Foundry API changes encountered while developing
// Tiny Supers.
//
// We obtain the collection classes here so that we can register our custom
// sheets with them.
const { Actors } = foundry.documents.collections;
const { Items } = foundry.documents.collections;

// ============================================================================
// INIT HOOK
// ============================================================================
//
// "init" is one of Foundry's most important lifecycle hooks.
//
// It runs during system initialisation, before the game is ready.
//
// This is the appropriate place to REGISTER system configuration such as:
//
//     Data models
//     Sheets
//     Settings
//     Keybindings
//     Handlebars helpers
//
// Think of init as:
//
//     "Tell Foundry what this system consists of."
//
// IMPORTANT:
//
// We use Hooks.once() rather than Hooks.on() because we only want this setup
// code to execute once.
//
// If you used Hooks.on() here, the callback could potentially be registered
// repeatedly if the hook were triggered more than once.
Hooks.once('init', () => {
  console.log('Tiny Supers | Initializing System');

  // ==========================================================================
  // REGISTER THE CUSTOM DATA MODELS
  // ==========================================================================
  //
  // This is an important Foundry v14 concept.
  //
  // We are NOT replacing Foundry's Actor or Item Document classes.
  //
  // Instead, we tell Foundry:
  //
  //     "When you encounter an Actor with type 'hero', use SuperHero as
  //      the TypeDataModel for its system data."
  //
  // The resulting structure is effectively:
  //
  //     Actor
  //       │
  //       ├── type = "hero"
  //       │
  //       └── system
  //             └── SuperHero schema
  //
  // This is why the model file contains:
  //
  //     class SuperHero extends foundry.abstract.TypeDataModel
  //
  // rather than extending Actor itself.
  CONFIG.Actor.dataModels.hero = SuperHero;

  // Same principle for Archetype Items.
  //
  // An Item whose type is "archetype" will use the Archetype TypeDataModel
  // to define/validate its system data.
  CONFIG.Item.dataModels.archetype = Archetype;

  // Same principle for Trait Items.
  //
  // IMPORTANT:
  //
  // The key here MUST match the Item type used elsewhere in the system.
  //
  // For example, an Item created with:
  //
  //     type: "trait"
  //
  // will use:
  //
  //     CONFIG.Item.dataModels.trait
  CONFIG.Item.dataModels.trait = Trait;

  // ==========================================================================
  // OTHER THINGS THAT CAN BE REGISTERED DURING INIT
  // ==========================================================================
  //
  // Foundry systems can register many other things during init.
  //
  // Examples include:
  //
  //     CONFIG.Item.documentClass
  //         Replace/customise the Item Document class.
  //
  //     game.settings.register()
  //         Register system settings.
  //
  //     game.keybindings.register()
  //         Register keyboard shortcuts.
  //
  //     Handlebars helpers
  //         Add custom functions usable by templates.
  //
  // We don't currently need these, but this is a useful reminder of why the
  // init hook exists.


  // ==========================================================================
  // REGISTER THE HERO ACTOR SHEET
  // ==========================================================================
  //
  // Foundry normally has a default Actor sheet.
  //
  // We don't want the standard sheet for our Tiny Supers Heroes, because our
  // custom ApplicationV2 sheet provides the Tiny Supers character sheet.
  //
  // First we remove the default core ActorSheetV2 registration.
  //
  // IMPORTANT:
  //
  // This does NOT delete ActorSheetV2 from Foundry.
  //
  // It simply removes the core sheet registration so that our sheet can
  // become the default sheet for Tiny Supers Hero Actors.
  Actors.unregisterSheet("core", foundry.applications.sheets.ActorSheetV2);  // Remove default sheet

  // Now register our own Hero sheet.
  //
  // "tiny-supers"
  //     = namespace/registration name for our sheet.
  //
  // SuperHeroSheet
  //     = the ApplicationV2 class that will be used.
  //
  // types: ["hero"]
  //     = only use this sheet for Actors whose type is "hero".
  //
  // makeDefault: true
  //     = make it the default sheet for those Actors.
  //
  // This is the connection between:
  //
  //     Actor type
  //         ↓
  //     SuperHero data model
  //         ↓
  //     SuperHeroSheet
  //
  Actors.registerSheet("tiny-supers", SuperHeroSheet, {
    types: ["hero"],
    makeDefault: true  // Use this sheet for all actors in your system
  });

  // ==========================================================================
  // REGISTER THE ARCHETYPE ITEM SHEET
  // ==========================================================================
  //
  // We register our custom Archetype ApplicationV2 sheet for Items whose
  // type is "archetype".
  //
  // Notice that we don't unregister the core ItemSheetV2 here.
  //
  // The Tiny Supers sheet is simply registered as the default sheet for
  // Archetype Items.
  //
  // This is enough because the registration is restricted to the "archetype"
  // Item type.
  //
  // The relationship is:
  //
  //     Item type "archetype"
  //             ↓
  //     Archetype data model
  //             ↓
  //     ItemArchetypeSheet
  Items.registerSheet("tiny-supers", ItemArchetypeSheet, {
    types: ["archetype"],
    makeDefault: true
  });

  // ==========================================================================
  // REGISTER THE TRAIT ITEM SHEET
  // ==========================================================================
  //
  // Same principle as the Archetype sheet, but for Trait Items.
  //
  //     Item type "trait"
  //             ↓
  //     Trait data model
  //             ↓
  //     ItemTraitSheet
  //
  Items.registerSheet("tiny-supers", ItemTraitSheet, {
    types: ["trait"],
    makeDefault: true
  });

  // ==========================================================================
  // REGISTER THE IMPORT APPLICATION AS A SETTINGS MENU
  // ==========================================================================
  //
  // Foundry's game.settings.registerMenu() lets us add a custom application
  // to the system's settings menu.
  //
  // This does NOT register a normal setting containing a value.
  //
  // Instead, it adds a BUTTON/MENU ENTRY that opens our ApplicationV2
  // importer.
  //
  // The important pieces are:
  //
  //     "tiny-supers"
  //         System namespace.
  //
  //     "importMenu"
  //         Unique identifier for this menu entry.
  //
  //     type: TinySupersImportApplication
  //         The ApplicationV2 class that Foundry should open when the user
  //         selects the menu entry.
  //
  //     restricted: true
  //         Only users with the required Foundry permissions can use it.
  game.settings.registerMenu("tiny-supers", "importMenu", {
    // Name shown by the settings menu.
    name: "Import Content",

    // Label for the button/menu entry.
    label: "Import JSON",

    // Helpful explanatory text shown to the user.
    hint: "Import actors and items from a JSON file.",

    // Font Awesome icon used by Foundry for the menu entry.
    icon: "fas fa-file-import",

    // The ApplicationV2 class that Foundry should instantiate when the
    // menu is opened.
    type: TinySupersImportApplication,

    // Restrict this menu to users with the required permissions.
    //
    // This is important because importing content modifies the world.
    restricted: true
  });
});

// ============================================================================
// SETUP HOOK
// ============================================================================
//
// "setup" happens after the basic game data has been loaded but before Foundry
// is completely ready.
//
// The general lifecycle is:
//
//     init
//       ↓
//     setup
//       ↓
//     ready
//
// A useful mental model is:
//
//     init
//         "Register/configure the system."
//
//     setup
//         "The game data exists; perform setup that depends on it."
//
//     ready
//         "Everything is ready for normal operation."
//
// At the moment Tiny Supers doesn't actually need to do anything during setup.
// The hook is kept here as a reminder/place to add future setup code if
// necessary.
Hooks.once('setup', function() {

  // This hook runs after the game's initial setup/data loading phase but
  // before the game reaches the ready state.

  console.log('Tiny Supers | Setup System');

  // --------------------------------------------------------------------------
  // FUTURE SETUP WORK
  // --------------------------------------------------------------------------
  //
  // If the system later needs something that depends on game data being
  // available, this is one possible place to do it.
  //
  // For example, older Foundry systems commonly registered sheets during
  // setup. In our v14 implementation, however, our sheet registration is
  // already handled during init.
  //
  // Don't move code here just because it "looks like setup code".
  // Choose the hook based on when Foundry needs the information.
});

// ============================================================================
// READY HOOK
// ============================================================================
//
// "ready" is the point at which Foundry has finished initialising the game
// and the user can interact with it normally.
//
// This is where we initialise the Tiny Supers runtime objects that actually
// need the fully initialised game.
//
// Unlike the model/sheet registrations above, the dice roller doesn't need
// to be REGISTERED with Foundry.
//
// It is simply a normal JavaScript ApplicationV2 object that we create when
// the game is ready.
Hooks.once("ready", () => {

  // ==========================================================================
  // CREATE OUR TINY SUPERS NAMESPACE
  // ==========================================================================
  //
  // "game" is Foundry's global game object.
  //
  // We create a Tiny Supers namespace on it so that other parts of the system
  // can access our runtime objects later.
  //
  // The ??= operator means:
  //
  //     "If game.tinySupers doesn't already exist, create an empty object."
  //
  // If it already exists, leave it alone.
  //
  // This is preferable to simply doing:
  //
  //     game.tinySupers = {};
  //
  // because that would overwrite anything already stored there.
  game.tinySupers ??= {};

  // ==========================================================================
  // CREATE THE DICE ROLLER APPLICATION
  // ==========================================================================
  //
  // TinySupersDiceRoller is an ApplicationV2 class.
  //
  // Here we create an actual INSTANCE of that class and store it on our
  // system namespace.
  //
  // This distinction is important:
  //
  //     TinySupersDiceRoller
  //         = the class / blueprint
  //
  //     new TinySupersDiceRoller()
  //         = an actual application instance/window
  //
  // Storing the instance on game.tinySupers means other code can later access
  // it using:
  //
  //     game.tinySupers.dice
  //
  // rather than having to create a second dice roller.
  game.tinySupers.dice = new TinySupersDiceRoller();

  // ==========================================================================
  // DISPLAY THE DICE ROLLER
  // ==========================================================================
  //
  // ApplicationV2 applications don't automatically appear simply because
  // we created an instance of them.
  //
  // We explicitly render the application here.
  //
  //     render()
  //         = tell Foundry to create/display the application's window.
  //
  //     force: true
  //         = explicitly request rendering even if Foundry believes the
  //           application is already rendered.
  //
  // The overall sequence is therefore:
  //
  //     new TinySupersDiceRoller()
  //             ↓
  //     create the ApplicationV2 instance
  //             ↓
  //     render()
  //             ↓
  //     _prepareContext()
  //             ↓
  //     Handlebars renders dice-roller.hbs
  //             ↓
  //     _onFirstRender()
  //             ↓
  //     _onRender()
  //
  // This connects the ApplicationV2 lifecycle we learned in the dice roller
  // class to the actual Foundry system startup process.
  game.tinySupers.dice.render({ force: true });
});