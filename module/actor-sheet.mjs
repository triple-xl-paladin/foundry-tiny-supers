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

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.actor = this.actor;
    context.system = this.actor.system;
    context.editable = this.isEditable;

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