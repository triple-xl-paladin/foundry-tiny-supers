// module/actor-sheet.mjs
const{api, sheets} = foundry.applications;

export class SuperHeroSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    id: "tiny-supers-actor-sheet",
    classes: ["tiny-supers", "actor-sheet"],
    tag: "form",
    position: {
      width: 900,
      height: 1024
    },
    actions: {
      deleteTrait: SuperHeroSheet.#deleteTrait
    },
    form: {
      handler: SuperHeroSheet.#onSubmit,
      //submitOnChange: false,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    body: {
      template: "systems/tiny-supers/templates/actor-sheet.hbs"
    }
  };

  static async #deleteTrait(event, target) {
    const itemId = target.dataset.itemId;
    const item = this.actor.items.get(itemId);

    if (!item) return;

    await item.delete();
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    console.log("SHEET ACTOR:", this.actor);
    console.log("ACTOR ITEMS:", this.actor.items);
    console.log("ACTOR ITEMS COLLECTION:", this.actor.items?.contents);

    context.actor = this.actor;
    context.system = this.actor.system;
    context.editable = this.isEditable;

    context.traits = this.actor.items?.contents?.filter(
      item => item.type === "trait"
    ) ?? [];

    console.log("ACTOR:", this.actor);
    console.log("ITEMS:", this.actor.items);
    console.log("TRAITS:", context.traits);

    return context;
  }

  static async #onSubmit(event, form, formData) {
    console.log("HANDLER CALLED");
    console.log(form.object);
    //event.preventDefault();
    console.log(formData.object);
    await this.actor.update(formData.object);
    //await form.object.update(formData.object);
  }
}