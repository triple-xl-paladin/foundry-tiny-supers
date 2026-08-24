/*
 * This file is part of the Tiny Supers system for Foundry VTT.
 *
 * Copyright (C) 2026 dev_null
 *
 * The Tiny Supers system is free software: you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
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
// DICE ROLLER CHAT INTEGRATION
// -----------------------------------------------------------------------------
//
// This file adds the Tiny Supers dice buttons directly underneath/alongside
// the Foundry Chat Log input.
//
// This is DIFFERENT from TinySupersDiceRoller.
//
// TinySupersDiceRoller:
//     = a standalone ApplicationV2 window.
//
// This code:
//     = injects our dice-roller Handlebars template into Foundry's existing
//       Chat Log UI.
//
// This distinction is important.
//
// We originally created a standalone ApplicationV2 dice roller, but for the
// actual Foundry UI we wanted the three dice buttons to sit with the chat
// input. This approach allows us to reuse the SAME Handlebars template
// without creating another floating Application window.
//
// The flow is:
//
//     Foundry Chat Log renders
//             ↓
//     renderChatLog hook fires
//             ↓
//     Render dice-roller.hbs
//             ↓
//     Insert resulting HTML into Chat Log
//             ↓
//     Find the buttons
//             ↓
//     Attach click listeners
//             ↓
//     User clicks button
//             ↓
//     rollTinySupers(type)


// -----------------------------------------------------------------------------
// IMPORT THE ACTUAL DICE-ROLLING LOGIC
// -----------------------------------------------------------------------------
//
// The UI does not contain the Tiny Supers dice rules.
//
// Those rules live in:
//
//     models/dice.mjs
//
// This module only needs to tell that function which type of roll the user
// requested.
//
// For example:
//
//     rollTinySupers("normal")
//     rollTinySupers("advantage")
//     rollTinySupers("disadvantage")
//
// This keeps the UI separate from the game mechanics.
import { rollTinySupers } from "./models/dice.mjs";

// ============================================================================
// RENDER CHAT LOG HOOK
// ============================================================================
//
// Foundry provides hooks for different stages of its UI lifecycle.
//
// "renderChatLog" fires when the Chat Log application has been rendered.
//
// This is important because we need the Chat Log's HTML to EXIST before we
// can insert our own HTML into it.
//
// In other words, this would not work reliably during "init":
//
//     document.getElementById("chat-message")
//
// because the Chat Log may not have been rendered yet.
//
// By waiting for renderChatLog, we know that Foundry has created the relevant
// Chat Log DOM elements.
//
// Hooks.once() means this callback runs only once.
//
// IMPORTANT:
//
// This is fine if we only want to add the controls to the Chat Log when it is
// first rendered.
//
// If Foundry destroys and recreates the Chat Log later in a way that causes
// it to render again, we may need Hooks.on() instead.
//
// For this implementation, once was sufficient.
Hooks.once("renderChatLog", async () => {

  // ==========================================================================
  // RENDER THE HANDLEBARS TEMPLATE
  // ==========================================================================
  //
  // Normally an ApplicationV2 class declares its template through PARTS:
  //
  //     static PARTS = {
  //       main: {
  //         template: "..."
  //       }
  //     };
  //
  // We aren't creating an ApplicationV2 here.
  //
  // Instead, we need to render the Handlebars template ourselves.
  //
  // Foundry provides:
  //
  //     foundry.applications.handlebars.renderTemplate()
  //
  // which takes:
  //
  //     1. The path to the Handlebars template.
  //     2. A context object containing data for the template.
  //
  // Our dice roller currently doesn't require any dynamic data, so we pass:
  //
  //     {}
  //
  // The result is the rendered HTML as a string.
  //
  // Because renderTemplate() is asynchronous, we use await.
  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/tiny-supers/templates/dice-roller.hbs",
    {}
  );

  // ==========================================================================
  // FIND THE FOUNDRY CHAT INPUT
  // ==========================================================================
  //
  // We now need to find the existing Chat Log element that we want to insert
  // our dice controls next to.
  //
  // "chat-message" is the ID of Foundry's chat message input.
  //
  // document.getElementById() searches the entire browser document for that
  // element.
  //
  // IMPORTANT DOM LESSON:
  //
  // At this point we are no longer dealing with ApplicationV2's abstract
  // rendering system. We are dealing directly with the browser DOM.
  const inputElement = document.getElementById("chat-message");

  // --------------------------------------------------------------------------
  // SAFETY CHECK
  // --------------------------------------------------------------------------
  //
  // Never assume the element exists.
  //
  // If Foundry changes its Chat Log HTML in a future version, or the Chat Log
  // isn't available for some reason, getElementById() may return null.
  //
  // Rather than causing:
  //
  //     Cannot read properties of null
  //
  // we simply stop here.
  //
  // This is particularly important when modifying Foundry's own UI because
  // its DOM structure isn't completely under our control.
  if (!inputElement) return;

  // ==========================================================================
  // INSERT OUR RENDERED HTML
  // ==========================================================================
  //
  // At this point:
  //
  //     content
  //         = HTML generated from dice-roller.hbs
  //
  //     inputElement
  //         = Foundry's existing chat input
  //
  // We now insert our HTML into Foundry's DOM.
  //
  // insertAdjacentHTML() is a browser DOM method.
  //
  // "afterend" means:
  //
  //     Insert the new HTML immediately AFTER inputElement.
  //
  // Conceptually:
  //
  //     BEFORE:
  //
  //     [chat input]
  //
  //
  //     AFTER:
  //
  //     [chat input]
  //     [Tiny Supers dice controls]
  //
  // IMPORTANT:
  //
  // We are NOT replacing the Chat Log's HTML.
  //
  // We are adding our own HTML alongside Foundry's existing HTML.
  inputElement.insertAdjacentHTML("afterend", content);

  // ==========================================================================
  // FIND THE HTML WE JUST INSERTED
  // ==========================================================================
  //
  // We now need a reference to the dice controls so that we can attach
  // event listeners to their buttons.
  //
  // inputElement.parentElement
  //     = the parent HTML element containing the chat input.
  //
  // querySelector()
  //     = search that parent element for our dice roller.
  //
  // The selector:
  //
  //     .tiny-supers.dice-roller
  //
  // means:
  //
  //     "Find an element which has BOTH the 'tiny-supers' and 'dice-roller'
  //      CSS classes."
  //
  // Those classes come from the dice-roller Handlebars template.
  //
  // Restricting the search to inputElement.parentElement is preferable to
  // searching the entire document because we know our controls were inserted
  // next to the chat input.
  const diceControls = inputElement.parentElement.querySelector(
    ".tiny-supers.dice-roller"
  );

  // --------------------------------------------------------------------------
  // SECOND SAFETY CHECK
  // --------------------------------------------------------------------------
  //
  // If the template didn't produce the expected element, stop rather than
  // trying to call querySelectorAll() on null.
  //
  // Again, this makes the code more robust against future template or Foundry
  // DOM changes.
  if (!diceControls) return;

  // ==========================================================================
  // FIND ALL DICE BUTTONS
  // ==========================================================================
  //
  // Our Handlebars template gives the dice buttons a data-roll attribute.
  //
  // For example:
  //
  //     <button data-roll="normal">Normal</button>
  //
  //     <button data-roll="advantage">Advantage</button>
  //
  //     <button data-roll="disadvantage">Disadvantage</button>
  //
  // Therefore:
  //
  //     [data-roll]
  //
  // selects every element containing that attribute.
  //
  // We deliberately search within diceControls rather than document so that
  // we only attach listeners to OUR buttons.
  diceControls.querySelectorAll("[data-roll]").forEach(button => {

    // ========================================================================
    // ATTACH CLICK HANDLER
    // ========================================================================
    //
    // Each button gets its own click event listener.
    //
    // This is normal browser DOM event handling rather than an ApplicationV2
    // form handler.
    //
    // That's an important lesson from this implementation:
    //
    // ApplicationV2 does not mean you have to use ApplicationV2's form/event
    // system for every piece of UI.
    //
    // When inserting small pieces of HTML into an existing Foundry interface,
    // ordinary DOM event listeners are often simpler.
    button.addEventListener("click", event => {

      // ----------------------------------------------------------------------
      // PREVENT THE BUTTON'S DEFAULT BROWSER BEHAVIOUR
      // ----------------------------------------------------------------------
      //
      // The buttons are inside HTML that may be associated with a form.
      //
      // Without preventing the default action, clicking the button could
      // potentially cause the browser/form to perform its normal submission
      // behaviour.
      //
      // We don't want that.
      //
      // We only want the button to trigger a Tiny Supers dice roll.
      event.preventDefault();

      // ----------------------------------------------------------------------
      // GET THE REQUESTED ROLL TYPE
      // ----------------------------------------------------------------------
      //
      // HTML5 data attributes are exposed in JavaScript through "dataset".
      //
      // Given:
      //
      //     <button data-roll="advantage">
      //
      // JavaScript gives us:
      //
      //     event.currentTarget.dataset.roll
      //
      // which produces:
      //
      //     "advantage"
      //
      // currentTarget is used rather than target because the button might
      // contain another element, such as an icon or span.
      //
      // currentTarget means:
      //
      //     "The button whose event listener is handling this event."
      const type = event.currentTarget.dataset.roll;

      console.log("Tiny Supers roll:", type);

      // ----------------------------------------------------------------------
      // PERFORM THE ACTUAL TINY SUPERS ROLL
      // ----------------------------------------------------------------------
      //
      // This is where the UI hands control over to the game rules.
      //
      // We don't calculate dice here.
      //
      // We don't create the Foundry Roll here.
      //
      // We don't count successes here.
      //
      // All of that belongs in models/dice.mjs.
      //
      // This UI simply says:
      //
      //     "The player requested this type of roll."
      //
      // and lets the dice model deal with it.
      //
      // Example:
      //
      //     type = "advantage"
      //
      // becomes:
      //
      //     rollTinySupers("advantage");
      //
      rollTinySupers(type);
    });
  });
});