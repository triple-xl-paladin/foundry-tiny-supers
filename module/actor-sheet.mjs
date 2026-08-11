// module/actor-sheet.mjs

// Foundry exposes the ApplicationV2 API and its standard sheet classes
// through foundry.applications.
//
// "api" contains things such as HandlebarsApplicationMixin.
// "sheets" contains the standard ApplicationV2 sheet classes, such as
// ActorSheetV2.
//
// Destructuring here just saves us from repeatedly writing:
// foundry.applications.api
// foundry.applications.sheets
const{api, sheets} = foundry.applications;


/*
 * ApplicationV2 mental model
 * --------------------------
 *
 * The Actor document contains the DATA.
 * This class is the VIEW/controller for displaying and editing that data.
 *
 * We are not creating a new Actor type here. Foundry's normal Actor document
 * is still used, with our custom data model defined elsewhere.
 *
 * ActorSheetV2 provides the standard Actor sheet behaviour.
 * HandlebarsApplicationMixin adds Handlebars template support.
 *
 * The order is important:
 *
 *     HandlebarsApplicationMixin(ActorSheetV2)
 *
 * means "take ActorSheetV2 and add Handlebars functionality to it".
 */
export class SuperHeroSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {

  /*
   * DEFAULT_OPTIONS
   * ---------------
   *
   * ApplicationV2 uses this object to configure the application.
   *
   * We spread super.DEFAULT_OPTIONS first so that we inherit the defaults
   * supplied by ActorSheetV2 rather than replacing them completely.
   */
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,

    // The ID is used by Foundry to identify this application.
    id: "tiny-supers-actor-sheet",

    // CSS classes applied to the application's root element.
    // These let us target the sheet from our system CSS
    classes: ["tiny-supers", "actor-sheet"],
    
    // Our Handlebars template renders a <form>.
    // This is important because the form handler below expects form data.
    tag: "form",
 
    // Initial size of the application window.
    // The CSS controls how the contents behave when they exceed this size.
    position: {
      width: 900,
      height: 1024
    },

    /*
     * actions
     * -------
     *
     * ApplicationV2 actions connect HTML elements in the template to
     * JavaScript methods.
     *
     * For example, an element in the template can have an action such as:
     *
     *     data-action="deleteTrait"
     *
     * Foundry then calls the method registered here.
     *
     * The methods are private (#) because they are only implementation
     * details of this sheet.
     */
    actions: {
      deleteTrait: SuperHeroSheet.#deleteTrait,
      deleteArchetype: SuperHeroSheet.#deleteArchetype
    },

    /*
     * form
     * ----
     *
     * This tells ApplicationV2 how to handle submission of our <form>.
     *
     * We deliberately use our own handler because the Actor sheet contains
     * both normal Actor fields and dynamically-created Item documents.
     *
     * closeOnSubmit: false means that submitting the form does not close
     * the character sheet.
     */
    form: {
      handler: SuperHeroSheet.#onSubmit,
      //submitOnChange: false,
      closeOnSubmit: false
    }
  };

  /*
   * PARTS
   * -----
   *
   * ApplicationV2 does not automatically render one big template in the
   * same way that the older Application system did.
   *
   * Instead, the application is divided into "parts".
   *
   * We currently only need one part: "body".
   *
   * The template path is relative to the system's root directory.
   */
  static PARTS = {
    body: {
      template: "systems/tiny-supers/templates/actor-sheet.hbs"
    }
  };

  /*
   * Delete a Trait Item from the Actor.
   *
   * IMPORTANT:
   *
   * Traits are not fields on the Actor anymore. They are separate Item
   * documents embedded inside the Actor.
   *
   * Therefore deleting a trait means deleting the Item document rather
   * than changing an Actor field.
   */
  static async #deleteTrait(event, target) {

    /*
     * The HTML element that triggered the action contains the Item ID
     * in a data attribute:
     *
     *     data-item-id="{{item.id}}"
     *
     * dataset converts that into:
     *
     *     target.dataset.itemId
     */
    const itemId = target.dataset.itemId;

    // Actor.items is the embedded Item collection belonging to this Actor.
    // get() retrieves the Item with the specified ID.
    const item = this.actor.items.get(itemId);

    // It is possible for the Item to have disappeared between rendering
    // the sheet and clicking the button, so don't attempt to delete
    // something that no longer exists.
    if (!item) return;

    // Deleting an embedded Item also updates the Actor's Item collection.
    await item.delete();
  }

  /*
   * Delete the Actor's Archetype Item.
   *
   * This is almost identical to deleteTrait, but keeping the two actions
   * separate makes the intent in the template clearer.
   */
  static async #deleteArchetype(event, target) {
    
    const itemId = target.dataset.itemId;
    const item = this.actor.items.get(itemId);

    if (!item) return;

    await item.delete();
  }

  /*
   * _prepareContext()
   * -----------------
   *
   * This is part of the ApplicationV2 rendering lifecycle.
   *
   * Its job is to prepare the data that will be made available to the
   * Handlebars template.
   *
   * Think of it as:
   *
   *     Actor data
   *          ↓
   *     _prepareContext()
   *          ↓
   *     Handlebars template
   *
   * We should therefore avoid putting HTML/UI logic in here. This method
   * prepares the data; the .hbs file decides how that data is displayed.
   */
  async _prepareContext(options) {
    // Always let the parent class prepare its context first.
    // ActorSheetV2 may add useful standard data that we don't want to lose.
    const context = await super._prepareContext(options);

    /*
     * These console logs were useful while learning how Foundry's
     * document collections work.
     *
     * They can eventually be removed once the sheet is stable.
     *
     * actor
     *   = the actual Actor document
     *
     * actor.items
     *   = the embedded Item collection belonging to that Actor
     *
     * actor.items.contents
     *   = a normal JavaScript array containing the Items
     */
    console.log("SHEET ACTOR:", this.actor);
    console.log("ACTOR ITEMS:", this.actor.items);
    console.log("ACTOR ITEMS COLLECTION:", this.actor.items?.contents);

    /*
     * Make the Actor and its system data explicitly available to the
     * Handlebars template.
     *
     * "actor" is the complete Actor document.
     *
     * "system" is the custom data defined by our Actor data model.
     *
     * "editable" tells the template whether the current user is allowed
     * to edit the sheet.
     */
    context.actor = this.actor;
    context.system = this.actor.system;
    context.editable = this.isEditable;

    /*
     * Traits are now Item documents embedded in the Actor.
     *
     * We therefore don't have to maintain separate trait1, trait2 and
     * trait3 fields on the Actor.
     *
     * Instead, look through all embedded Items and select the ones whose
     * type is "trait".
     *
     * filter() returns ALL matching Items, which is exactly what we need
     * because an Actor can have up to three traits.
     *
     * The optional chaining (?.) prevents an error if items is not
     * available for some reason.
     *
     * The nullish coalescing operator (??) gives us an empty array if
     * the result is undefined.
     */
    context.traits = this.actor.items?.contents?.filter(
      item => item.type === "trait"
    ) ?? [];

    /*
     * An archetype is also an Item, but unlike traits an Actor can only
     * have one archetype.
     *
     * Therefore we use find() instead of filter().
     *
     * find() returns the first matching Item, or undefined if none exists.
     *
     * We convert undefined to null because the template can then simply
     * test whether context.archetype exists.
     */
    context.archetype = this.actor.items?.contents?.find(
      item => item.type === "archetype"
    ) ?? null;

    /*
     * Maximum Stress is DERIVED from the archetype.
     *
     * This is an important distinction:
     *
     *     Archetype Item
     *          ↓
     *     archetype.system.stress
     *          ↓
     *     context.maxStress
     *
     * We don't copy this value into the Actor because doing so would
     * create two sources of truth.
     *
     * The archetype owns the maximum Stress value.
     *
     * The Actor's Stress field represents the hero's CURRENT Stress and
     * is therefore player-managed.
     *
     * The optional chaining means that if the hero has no archetype,
     * this expression doesn't throw an error.
     *
     * ?? 0 gives the template a sensible default when there is no
     * archetype.
     */
    context.maxStress = context.archetype?.system.stress ?? 0;
    
    console.log("ACTOR:", this.actor);
    console.log("ITEMS:", this.actor.items);
    console.log("TRAITS:", context.traits);

    // Return the completed context to ApplicationV2.
    // The Handlebars template receives this object as its data.
    return context;
  }

  /*
   * Form submission
   * ---------------
   *
   * ApplicationV2 calls this method when the <form> is submitted.
   *
   * formData is the FormDataExtended object generated by Foundry.
   *
   * formData.object converts the submitted HTML form values into a normal
   * JavaScript object suitable for updating the Actor.
   */
  static async #onSubmit(event, form, formData) {
    console.log("HANDLER CALLED");
    console.log(form.object);
    //event.preventDefault();
    console.log(formData.object);
 
    /*
     * Update the Actor with the submitted form data.
     *
     * Notice that this only updates Actor fields.
     *
     * Embedded Items such as Traits and Archetypes are separate
     * documents and are created/deleted/updated independently.
     */
    await this.actor.update(formData.object);
  }

  /*
   * _onDropItem()
   * -------------
   *
   * Foundry calls this when an Item is dragged onto the Actor sheet.
   *
   * We inspect the Item first so that we can enforce the Tiny Supers
   * character creation rules before allowing Foundry to create the
   * embedded Item.
   *
   * Returning super._onDropItem(...) at the end is important:
   *
   *     Our code = validation/rules
   *     Foundry = actually performing the drop
   *
   * This means we don't have to recreate Foundry's Item-drop behaviour.
   */
  async _onDropItem(event, item) {

    console.log("DROPPED ITEM:", item.name, item.type);


    /*
     * ARCHETYPE
     *
     * Tiny Supers allows only one archetype per hero.
     *
     * actor.items.find() searches the Actor's existing embedded Items.
     */
    if (item.type === "archetype") {

      const existingArchetype = this.actor.items.find(
          existing => existing.type === "archetype"
      );

      /*
       * If an archetype already exists, stop here.
       *
       * "return" prevents the call to super._onDropItem() below,
       * meaning Foundry never gets told to create the Item.
       */
      if (existingArchetype) {
          ui.notifications.warn("This hero already has an archetype.");
          return;
      }
    }

    /*
     * TRAITS
     *
     * Tiny Supers allows a maximum of three traits.
     *
     * filter() returns all existing trait Items, and length tells us
     * how many there are.
     */
    if (item.type === "trait") {

        const traitCount = this.actor.items.filter(
            existing => existing.type === "trait"
        ).length;

        // Reject the drop if the Actor already has three traits.
        if (traitCount >= 3) {
            ui.notifications.warn("This hero already has three traits.");
            return;
        }
    }

    /*
     * If we get here, our system-specific validation has passed.
     *
     * We now hand the event back to Foundry's normal Item-drop handler.
     *
     * This is a useful general pattern when extending Foundry:
     *
     *     1. Do our custom validation.
     *     2. Stop if the operation isn't allowed.
     *     3. Call super if it is allowed.
     *
     * That lets Foundry continue doing the complicated document
     * creation/update work for us.
     */
    return super._onDropItem(event, item);
  }
}