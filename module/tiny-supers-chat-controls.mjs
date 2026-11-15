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
//
// IMPORTANT — DOM STABILITY:
//
// Foundry v14 moves the #chat-message element around in the DOM when the
// sidebar opens/closes. In particular:
//
//     BEFORE (sidebar closed):
//       #chat-message  →  #chat-notifications  →  #ui-right-column-1
//
//     AFTER (sidebar open):
//       #chat-message  →  form.chat-form  →  #chat.tab  →  #sidebar
//                          →  #sidebar-content  →  #ui-right
//
// The #chat-message element is RE-CREATED by Foundry at the new location.
// Our dice roller must follow it.
//
// The renderChatLog hook does NOT fire when the sidebar opens — only when
// the ChatLog application itself is rendered. So we use a MutationObserver
// on #ui-right (the common ancestor of both locations) to detect when the
// chat input's parent changes, and re-anchor the dice roller each time.


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
// MODULE-LEVEL STATE
// ============================================================================
//
// The rendered HTML string and the MutationObserver are stored at module
// level so they persist across multiple renderChatLog fires.
//
// _diceRollerHtml:
//     The rendered dice-roller.hbs template. Rendered once on the first
//     renderChatLog fire, then reused on subsequent fires.
//
//     We cache it because renderTemplate() is async and we don't want to
//     re-render the template every time the sidebar opens/closes.
//
// _mutationObserver:
//     The MutationObserver that watches for the #chat-message element
//     moving in the DOM. Set up on the first renderChatLog fire.
let _diceRollerHtml = null;
let _mutationObserver = null;

// ============================================================================
// RENDER AND INSERT THE DICE ROLLER
// ============================================================================
//
// This is the main function. It:
//   1. Renders the dice-roller template (or uses the cached HTML).
//   2. Finds the current #chat-message element.
//   3. Removes any previously injected chat-log dice roller.
//   4. Inserts the dice roller next to the chat input.
//   5. Attaches click listeners to the buttons.
//
// It is called:
//   - From the renderChatLog hook (first fire).
//   - From the MutationObserver callback (when the chat input moves).
async function _injectDiceRoller() {

  // ==========================================================================
  // RENDER THE HANDLEBARS TEMPLATE (OR USE CACHED HTML)
  // ==========================================================================
  //
  // The template is rendered once and cached. Subsequent calls reuse the
  // cached HTML, which is much faster than calling renderTemplate() again.
  //
  // renderTemplate() is async because it needs to load and parse the
  // Handlebars template file.
  if (!_diceRollerHtml) {
    _diceRollerHtml = await foundry.applications.handlebars.renderTemplate(
      "systems/tiny-supers/templates/dice-roller.hbs",
      {}
    );
  }

  // ==========================================================================
  // FIND THE CURRENT FOUNDRY CHAT INPUT
  // ==========================================================================
  //
  // "chat-message" is the ID of Foundry's chat message input.
  //
  // IMPORTANT:
  //
  // The #chat-message element may not exist yet (e.g. during the very first
  // renderChatLog fire before the sidebar has fully rendered). If it doesn't
  // exist, we stop here — the MutationObserver will catch us later when the
  // input appears.
  const inputElement = document.getElementById("chat-message");
  if (!inputElement) return;

  // ==========================================================================
  // REMOVE ANY PREVIOUSLY INJECTED DICE ROLLER
  // ==========================================================================
  //
  // We may be re-running this function because the chat input moved. Any
  // previously injected .die-roller-content is now orphaned in its old
  // parent.
  //
  // We must remove it before inserting the new one, or we'll have two sets
  // of buttons.
  //
  // IMPORTANT SCOPE LIMITATION:
  //
  // The .die-roller-content class is used by TWO surfaces:
  //
  //   1. The chat-log injection (this code) — parented into #chat-
  //      notifications or wherever Foundry's chat input happens to be.
  //
  //   2. The standalone TinySupersDiceRoller ApplicationV2 window —
  //      parented into a .window-content element.
  //
  // We must only remove the chat-log-injected ones. If we removed ALL
  // .die-roller-content elements, we would destroy the standalone dice
  // roller window's buttons.
  //
  // The standalone window's .die-roller-content is always inside a
  // .window-content ancestor. The chat-log injection is never inside a
  // .window-content. So we filter: remove only rollers that do NOT have
  // a .window-content ancestor.
  document.querySelectorAll(".die-roller-content").forEach(roller => {
    // If this roller is inside a .window-content, it belongs to the
    // standalone dice roller window — leave it alone.
    if (roller.closest(".window-content")) return;
    // Otherwise it's a chat-log injection from a previous render.
    roller.remove();
  });

  // ==========================================================================
  // INSERT THE DICE ROLLER NEXT TO THE CHAT INPUT
  // ==========================================================================
  //
  // "afterend" inserts the HTML immediately AFTER inputElement, as a
  // sibling.
  //
  // Conceptually:
  //
  //     BEFORE:
  //
  //     [chat input]
  //
  //     AFTER:
  //
  //     [chat input]
  //     [Tiny Supers dice controls]
  inputElement.insertAdjacentHTML("afterend", _diceRollerHtml);

  // ==========================================================================
  // FIND THE HTML WE JUST INSERTED
  // ==========================================================================
  //
  // We need a reference to the dice roller so we can attach event listeners
  // to its buttons.
  //
  // We search within inputElement.parentElement because we know the dice
  // roller was inserted as a sibling of the chat input.
  const diceControls = inputElement.parentElement.querySelector(
    ".die-roller-content"
  );

  // If the template didn't produce the expected element, stop.
  if (!diceControls) return;

  // ==========================================================================
  // ATTACH CLICK LISTENERS TO THE DICE BUTTONS
  // ==========================================================================
  //
  // Our Handlebars template gives the dice buttons a data-roll attribute.
  //
  // We search within diceControls so we only attach listeners to OUR
  // buttons (not the standalone window's buttons).
  diceControls.querySelectorAll("[data-roll]").forEach(button => {
    button.addEventListener("click", event => {
      // Prevent the default form submission behaviour.
      event.preventDefault();

      // Get the requested roll type from the data attribute.
      //
      // currentTarget (not target) because the button might contain
      // another element (an icon or span), and we want the button's
      // dataset, not the icon's.
      const type = event.currentTarget.dataset.roll;

      // Perform the actual Tiny Supers roll.
      rollTinySupers(type);
    });
  });
}

// ============================================================================
// MUTATION OBSERVER
// ============================================================================
//
// The MutationObserver watches for changes to the DOM that indicate the
// #chat-message element has moved (i.e. its parent changed).
//
// When the sidebar opens/closes, Foundry re-creates the #chat-message
// element at a new location. This triggers a "childList" mutation on the
// old and new parents.
//
// We observe #ui-right because it is the common ancestor of both
// locations:
//
//     #ui-right
//       ├── #ui-right-column-1  (collapsed: #chat-message lives here)
//       └── #sidebar            (expanded:  #chat-message lives here)
//
// The observer callback checks whether the #chat-message element's parent
// has changed. If it has, we re-inject the dice roller next to the current
// location.

function _setupMutationObserver() {

  // Find the #ui-right element. It's the common ancestor of both the
  // collapsed and expanded chat input locations.
  const uiRight = document.querySelector("#ui-right");
  if (!uiRight) return;

  // Track the last known parent of #chat-message. We compare against this
  // to detect moves.
  let lastChatInputParent = null;

  // The observer callback. It fires whenever the DOM changes in a way
  // that matches the options below.
  const observerCallback = (mutations) => {
    for (const mutation of mutations) {

      // We only care about "childList" mutations (elements added or
      // removed from a parent).
      if (mutation.type !== "childList") continue;

      // Find the current #chat-message element.
      const chatInput = document.getElementById("chat-message");
      if (!chatInput) continue;

      // Get its current parent.
      const currentParent = chatInput.parentElement;

      // If the parent has changed (or this is the first time we're seeing
      // the chat input), re-inject the dice roller.
      if (currentParent !== lastChatInputParent) {
        lastChatInputParent = currentParent;
        // Re-inject asynchronously. We don't want to block the mutation
        // callback — the DOM is in flux, and renderTemplate() is async
        // anyway.
        _injectDiceRoller();
      }
    }
  };

  // Create the observer.
  //
  // childList: true
  //     Watch for children being added to or removed from #ui-right and
  //     all its descendants (subtree: true).
  //
  // subtree: true
  //     Recurse into all descendants. Without this, we'd only see
  //     direct children of #ui-right, which isn't enough — the
  //     #chat-message element is several levels deep.
  const observer = new MutationObserver(observerCallback);
  observer.observe(uiRight, {
    childList: true,
    subtree: true
  });

  // Store the observer so we don't create multiple observers if
  // renderChatLog fires again.
  _mutationObserver = observer;
}

// ============================================================================
// RENDER CHAT LOG HOOK
// ============================================================================
//
// Foundry provides hooks for different stages of its UI lifecycle.
//
// "renderChatLog" fires when the Chat Log application has been rendered.
//
// We use this hook to:
//   1. Render the dice-roller template (first fire only, then cached).
//   2. Set up the MutationObserver.
//   3. Inject the dice roller next to the current chat input.
//
// IMPORTANT — Hooks.on(), NOT Hooks.once():
//
// The renderChatLog hook can fire multiple times. We use Hooks.on() so we
// re-inject the dice roller each time it fires. The idempotent removal
// inside _injectDiceRoller() ensures we never accumulate duplicates.
Hooks.on("renderChatLog", async () => {

  // Set up the MutationObserver (only once).
  //
  // If _mutationObserver is already set, we skip this — the observer is
  // still watching the DOM.
  if (!_mutationObserver) {
    _setupMutationObserver();
  }

  // Inject the dice roller next to the current chat input.
  await _injectDiceRoller();
});
