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

// models/dice.mjs
//
// This file contains the actual Tiny Supers dice-rolling RULES.
//
// IMPORTANT DESIGN DECISION:
//
// The dice roller Application does NOT contain these rules.
//
// The Application only says:
//
//     "The player clicked the Advantage button."
//
// This module decides:
//
//     "Advantage means 3d6."
//
// This separation means the game mechanics can be used by other parts of the
// system without needing the dice roller window.
//
// For example, eventually an Actor sheet, macro, chat command or another
// application could call:
//
//     rollTinySupers("normal", actor);
//
// without needing to know how the roll is implemented.


// -----------------------------------------------------------------------------
// ROLL TINY SUPERS DICE
// -----------------------------------------------------------------------------
//
// This is an exported function rather than a class.
//
// We don't need to maintain state between rolls, so a simple function is
// appropriate.
//
// "type" determines which kind of Tiny Supers roll is being made.
//
// "actor" is optional. If supplied, the resulting ChatMessage is associated
// with that Actor.
//
// The defaults are important:
//
//     type = "normal"
//         If the caller doesn't specify a roll type, perform a normal roll.
//
//     actor = null
//         If no Actor is supplied, the roll is made without associating it
//         with a particular Actor.
export async function rollTinySupers(type = "normal", actor = null) {
  // -------------------------------------------------------------------------
  // DETERMINE THE ACTOR FOR THE CHAT SPEAKER
  // -------------------------------------------------------------------------
  //
  // The caller may not supply an Actor (for example, the standalone dice
  // roller and the Chat Log dice buttons both call this function with only
  // a roll type).
  //
  // In that case we fall back to the CURRENT USER's character, so that the
  // roll still appears in Chat under the right player's name.
  //
  //     game.user
  //         = the currently active Foundry user.
  //
  //     game.user.character
  //         = the Actor document that user is currently playing, or null
  //           if the user has no character selected.
  //
  // If there is no character either, actor stays null and the roll is made
  // without an associated Actor (same as before this change).
  if (!actor) {
    actor = game.user?.character ?? null;
  }
  // ---------------------------------------------------------------------------
  // DETERMINE THE DICE FORMULA
  // ---------------------------------------------------------------------------
  //
  // Foundry's Roll class accepts formulas such as:
  //
  //     "2d6"
  //     "3d6"
  //     "1d6"
  //
  // We first determine the appropriate formula based on the Tiny Supers
  // roll type.
  //
  // Keeping this decision in one place means the rest of the function doesn't
  // need to care about the difference between normal, advantage and
  // disadvantage rolls.
  let formula;

  // switch is useful here because there are several possible roll types.
  //
  // This translates the Tiny Supers rule into Foundry's dice notation.
  switch (type) {
    // -------------------------------------------------------------------------
    // ADVANTAGE
    // -------------------------------------------------------------------------
    //
    // Advantage = 3d6.
    case "advantage":
      formula = "3d6";
      break;

    // -------------------------------------------------------------------------
    // DISADVANTAGE
    // -------------------------------------------------------------------------
    //
    // Disadvantage = 1d6.
    case "disadvantage":
      formula = "1d6";
      break;

    // -------------------------------------------------------------------------
    // NORMAL
    // -------------------------------------------------------------------------
    //
    // Anything not explicitly recognised above currently becomes a normal
    // Tiny Supers roll.
    //
    // This also handles the default case when type is "normal".
    default:
      formula = "2d6";
  }

  // ---------------------------------------------------------------------------
  // CREATE THE FOUNDRY ROLL
  // ---------------------------------------------------------------------------
  //
  // Roll is a Foundry-provided class.
  //
  // At this point we are creating a Roll object from the formula, but the
  // dice haven't necessarily been evaluated yet.
  //
  // For example:
  //
  //     new Roll("2d6")
  //
  // represents the roll that we are about to perform.
  const roll = new Roll(formula);

  // ---------------------------------------------------------------------------
  // EVALUATE THE ROLL
  // ---------------------------------------------------------------------------
  //
  // evaluate() actually performs the roll.
  //
  // It is asynchronous, hence:
  //
  //     await roll.evaluate()
  //
  // After this completes, the Roll object contains the actual dice results.
  await roll.evaluate();

  // ---------------------------------------------------------------------------
  // COUNT SUCCESSFUL DICE
  // ---------------------------------------------------------------------------
  //
  // Tiny Supers determines success on individual dice.
  //
  // A die result of 5 or 6 is a success.
  //
  // Foundry stores the individual dice results inside the Roll object.
  //
  // roll.dice[0]
  //     = the first dice term in the formula.
  //
  // For our current formulas there is only one dice term:
  //
  //     2d6
  //     3d6
  //     1d6
  //
  // .results contains the individual dice results.
  //
  // We use filter() to keep only dice whose result is >= 5.
  //
  // For example:
  //
  //     [2, 5, 6]
  //
  // becomes:
  //
  //     [5, 6]
  //
  // .length then tells us how many successes there were:
  //
  //     2
  //
  // IMPORTANT JAVASCRIPT LESSON:
  //
  // filter() doesn't change the original array. It creates a new array
  // containing only the elements that passed the test.
  //
  // NOTE:
  //
  // roll.dice[0] is the FIRST dice TERM in the formula. Our current formulas
  // (1d6, 2d6, 3d6) each contain a single dice term, so this is correct.
  //
  // If a formula ever gains a second dice term (for example "2d6+1d6"),
  // this expression would only count successes on the first term. At that
  // point the success count should be computed across roll.dice (every
  // term) rather than roll.dice[0] only.
  const successes = roll.dice[0].results
    .filter(die => die.result >= 5)
    .length;

  // ---------------------------------------------------------------------------
  // SEND THE RESULT TO FOUNDRY CHAT
  // ---------------------------------------------------------------------------
  //
  // Foundry's Roll object can be displayed as a ChatMessage.
  //
  // toMessage() creates the standard Foundry chat output containing the
  // rendered dice roll.
  //
  // We provide two pieces of additional information:
  //
  //     speaker
  //         Who/what is making the roll.
  //
  //     flavor
  //         Additional descriptive text displayed with the roll.
  await roll.toMessage({
    // -------------------------------------------------------------------------
    // DETERMINE THE CHAT SPEAKER
    // -------------------------------------------------------------------------
    //
    // If an Actor was supplied, associate the message with that Actor.
    //
    //     actor ? ... : ...
    //
    // is JavaScript's conditional (ternary) operator.
    //
    // It means:
    //
    //     IF actor exists
    //         use ChatMessage.getSpeaker({ actor })
    //
    //     OTHERWISE
    //         use the normal current speaker
    //
    // This allows the same function to work both from an Actor-specific
    // interface and from a standalone dice roller.
    speaker: actor 
      ? ChatMessage.getSpeaker({ actor })
      : ChatMessage.getSpeaker(),

    // -------------------------------------------------------------------------
    // CHAT MESSAGE DESCRIPTION
    // -------------------------------------------------------------------------
    //
    // flavor is additional text displayed alongside the roll.
    //
    // Template literals use backticks (`) and allow us to insert variables
    // using ${...}.
    //
    // For example:
    //
    //     type = "advantage"
    //     successes = 2
    //
    // produces:
    //
    //     advantage roll: 2 successes
    flavor: `${type} roll: ${successes} successes`
  });

  // ---------------------------------------------------------------------------
  // RETURN THE NUMBER OF SUCCESSES
  // ---------------------------------------------------------------------------
  //
  // The function doesn't just display the result in Chat.
  //
  // It also returns the number of successes to the code that called it.
  //
  // This is useful because another part of the system could do something with
  // the result:
  //
  //     const successes = await rollTinySupers("normal", actor);
  //
  // and then use successes for further game logic.
  //
  // This is another useful separation:
  //
  //     dice.mjs
  //         performs the roll and returns the result
  //
  //     Application
  //         decides how the user initiates the roll
  //
  //     Foundry Chat
  //         displays the result
  return successes;
}