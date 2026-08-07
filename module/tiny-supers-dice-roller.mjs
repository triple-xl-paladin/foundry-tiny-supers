import { rollTinySupers } from "./models/dice.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TinySupersDiceRoller extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    classes: ["tiny-supers", "dice-roller"],

    window: {
      title: "Tiny Supers Dice",
      controls: []
    },

    position: {
      width: 300,
      height: 200
    }
  };

  static PARTS = {
    main: {
      template: "systems/tiny-supers/templates/dice-roller.hbs"
    }
  };

  async _onRender(context, options) {
    super._onRender(context, options);

    this.element.querySelectorAll("[data-roll]")
      .forEach(button => {
        button.addEventListener("click", event => {
          const type = event.currentTarget.dataset.roll;
          rollTinySupers(type);
        });
      });
  }

  async _prepareContext() {
    console.log("Dice roller context");
    return {};
  }

  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    console.log(this.window);
    this.window.close.remove();
    }
}