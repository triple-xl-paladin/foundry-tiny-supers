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

import { rollTinySupers } from "./models/dice.mjs";

Hooks.once("renderChatLog", async () => {

  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/tiny-supers/templates/dice-roller.hbs",
    {}
  );

  const inputElement = document.getElementById("chat-message");

  if (!inputElement) return;

  // Insert the rendered HTML directly after the chat input.
  inputElement.insertAdjacentHTML("afterend", content);

  // Find the element we just inserted.
  const diceControls = inputElement.parentElement.querySelector(
    ".tiny-supers.dice-roller"
  );

  if (!diceControls) return;

  // Attach the listeners directly to the buttons.
  diceControls.querySelectorAll("[data-roll]").forEach(button => {

    button.addEventListener("click", event => {

      event.preventDefault();

      const type = event.currentTarget.dataset.roll;

      console.log("Tiny Supers roll:", type);

      rollTinySupers(type);
    });

  });
});