// module/actor-sheet.mjs
const{api, sheets} = foundry.applications;

export class ItemArchetypeSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    id: "tiny-supers-item-archetype-sheet",
    classes: ["tiny-supers", "item-archetype-sheet"],
    tag: "form",
    position: {
      width: 900,
      height: 1024
    },
    form: {
      handler: ItemArchetypeSheet.#onSubmit,
      //submitOnChange: false,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    body: {
      template: "systems/tiny-supers/templates/item-archetype-sheet.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.item = this.item;
    context.system = this.item.system;
    context.editable = this.isEditable;

    return context;
  }

  static async #onSubmit(event, form, formData) {
    console.log("Submitting item archetype handler called");
    console.log(form.object);
    //event.preventDefault();
    console.log(formData.object);
    await this.item.update(formData.object);
    //await form.object.update(formData.object);
  }
}