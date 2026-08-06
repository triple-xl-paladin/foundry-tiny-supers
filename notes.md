# Building system module in Foundry VTT v14

Start with system.json
- define id and name of module
- define compatibility
- in esmodule link to the main mjs

The main.mjs will link to all the mjs files

Create the model in module folder like actor.mjs. Actor will define the fields for the character sheet.
You will then need to create another mjs extending ActorSheet which will define the fields and the size to display the character sheet.
The hbs will be the html/css of the actual rendering 