// tiny-supers.mjs

// 1. Import your custom classes
import { SuperHeroSheet } from './module/actor-sheet.mjs';
import { SuperHero } from './module/actor.mjs';
import { TinySupersDiceRoller } from './tiny-supers-dice-roller.mjs'
import { ItemArchetypeSheet } from './module/item-archetype-sheet.mjs';
import { Archetypes } from './module/item-archetype-model.mjs';

const { Actors } = foundry.documents.collections;
const { Items } = foundry.documents.collections;

// 2. Register your system's components during the 'init' hook
Hooks.once('init', () => {
  console.log('Tiny Supers | Initializing System');

  // Register the custom Actor class
  CONFIG.Actor.dataModels.hero = SuperHero;
  CONFIG.Item.dataModels.Archetypes = Archetypes;
  
  // You can also register other things here, like:
  // - CONFIG.Item.documentClass
  // - Game settings (game.settings.register)
  // - Keybindings (game.keybindings.register)
  // - Custom Handlebars helpers

  // Tell Foundry what sheet to display for those Actors
  Actors.unregisterSheet("core", foundry.applications.sheets.ActorSheetV2);  // Remove default sheet
  Actors.registerSheet("tiny-supers", SuperHeroSheet, {
    types: ["hero"],
    makeDefault: true  // Use this sheet for all actors in your system
  });

  Items.unregisterSheet("core",foundry.applications.sheets.ItemSheetV2);
  Items.registerSheet("tiny-supers", ItemArchetypeSheet, {
    types: ["archetype"],
    makeDefault: false
  })

});

Hooks.once('setup', function() {
  // This hook runs after all documents are loaded but before the canvas is ready.
  // It's a good place for tasks that require game data to be available [citation:12].
  console.log('Tiny Supers | Setup System');

  // You might register system-specific sheets here if you have any.
  // For example:
  // Actors.unregisterSheet("core", ActorSheet);
  // Actors.registerSheet("tiny-supers", TinySupersActorSheet, { makeDefault: true });
});

Hooks.once("ready", () => {
    game.tinySupers ??= {};
    game.tinySupers.dice = new TinySupersDiceRoller();
    game.tinySupers.dice.render({ force: true });
});