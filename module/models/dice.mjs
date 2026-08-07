// dice.mjs

export async function rollTinySupers(type = "normal", actor = null) {

  let formula;

  switch (type) {
    case "advantage":
      formula = "3d6";
      break;

    case "disadvantage":
      formula = "1d6";
      break;

    default:
      formula = "2d6";
  }

  const roll = new Roll(formula);
  await roll.evaluate();

  const successes = roll.dice[0].results
    .filter(die => die.result >= 5)
    .length;

  await roll.toMessage({
    speaker: actor 
      ? ChatMessage.getSpeaker({ actor })
      : ChatMessage.getSpeaker(),
    flavor: `${type} roll: ${successes} successes`
  });

  return successes;
}