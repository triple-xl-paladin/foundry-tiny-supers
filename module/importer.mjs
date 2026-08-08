export class TinySupersImporter {

    static async import(file) {

        const text = await file.text();

        const data = JSON.parse(text);

        const keys = Object.keys(data);

        if (keys.length !== 1) {
            throw new Error("Import file must contain exactly one root collection.");
        }

        switch (keys[0]) {

            case "traits":
                await this.#importTraits(data.traits);
                break;

            case "archetypes":
                await this.#importArchetypes(data.archetypes);
                break;

            case "actors":
                await this.#importActors(data.actors);
                break;

            default:
                throw new Error(`Unknown collection '${keys[0]}'`);
        }
                        
    }

    static async #getTraitsPack() {
        const packName = "tiny-supers-traits";

        // See if the world already has this pack
        let pack = game.packs.get(`world.${packName}`);

        if (pack) return pack;

        // Create it if it doesn't exist
        pack = await foundry.documents.collections.CompendiumCollection.createCompendium({
            name: packName,
            label: "Tiny Supers - Traits",
            type: "Item"
        });

        return pack;
    }   

    static async #importTraits(traits) {

        const pack = await this.#getTraitsPack();

        const documents = traits.map(trait => ({
            name: trait.trait,
            type: "trait",
            system: {
                trait: trait.trait,
                trait_desc: trait.trait_desc,
                trait_group: trait.trait_group
            }
        }));

        await pack.documentClass.createDocuments(documents, {
            pack: pack.collection
        });
    }


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

    static async #getArchetypesPack() {
        const packName = "tiny-supers-archetypes";

        // See if the world already has this pack
        let pack = game.packs.get(`world.${packName}`);

        if (pack) return pack;

        // Create it if it doesn't exist
        pack = await foundry.documents.collections.CompendiumCollection.createCompendium({
            name: packName,
            label: "Tiny Supers - Archetypes",
            type: "Item"
        });

        return pack;
    }   

    static async #importArchetypes(data) {
        const pack = await this.#getArchetypesPack();

        const documents = data.map(archetype => ({
            name: archetype.archetype,
            type: "archetype",
            system: {
                archetype: archetype.archeetype,
                archetype_desc: archetype.archetype_desc,
                stress: archetype.stress,
                archetype_trait: archetype.archetype_trait,
                source: archetype.source
            }
        }));

        await pack.documentClass.createDocuments(documents, {
            pack: pack.collection
        });

    }

    static async #getActorsPack() {
        const packName = "tiny-supers-actors";

        // See if the world already has this pack
        let pack = game.packs.get(`world.${packName}`);

        if (pack) return pack;

        // Create it if it doesn't exist
        pack = await foundry.documents.collections.CompendiumCollection.createCompendium({
            name: packName,
            label: "Tiny Supers - Pregens",
            type: "Actor"
        });

        return pack;
    }   

    static async #importActors(data) {
        const pack = await this.#getActorsPack();

        const documents = data.map(actor => ({
            name: actor.name,
            type: "superhero",
            system: {
              civilianIdentity: actor.civilianIdentity,
              appearance: actor.appearance,
              beliefs: actor.beliefs,
              weakness: actor.weakness,
              archetype: actor.archetype,
              powerOrigin: actor.powerOrigin,
              stress: actor.stress,
              trait1: actor.trait1,
              trait2: actor.trait2,
              trait3: actor.trait3,
              masteredWeapons: actor.masteredWeapons,
              proficientWeapons: actor.proficientWeapons,
              powerLevel:actor.powerLevel,
            }
        }));

        await pack.documentClass.createDocuments(documents, {
            pack: pack.collection
        });

    }

}