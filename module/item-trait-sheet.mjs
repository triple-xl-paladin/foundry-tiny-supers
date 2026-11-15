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

// module/item-trait-sheet.mjs
//
// This is the custom ApplicationV2 sheet used to display and edit a
// Tiny Supers Trait Item.
//
// The important mental model to remember is:
//
//     ItemTraitSheet
//          |
//          | displays / edits
//          v
//     Foundry Item Document
//
// The sheet is the USER INTERFACE. The Item is the actual DATA.
//
// This distinction becomes particularly important when submitting the form.
// The HTML form is not itself the Item; we use the submitted form data to
// update the underlying Item Document.


// -----------------------------------------------------------------------------
// ACCESS THE FOUNDRY APPLICATIONV2 API
// -----------------------------------------------------------------------------
//
// Foundry v14 organises the modern ApplicationV2 classes underneath:
//
//     foundry.applications
//
// We destructure the two namespaces we need here:
//
//     api
//         Contains the general ApplicationV2 API, including
//         HandlebarsApplicationMixin.
//
//     sheets
//         Contains Foundry's standard ApplicationV2 document sheets,
//         including ItemSheetV2.
//
// This is part of the newer Foundry API. Older Foundry examples often use
// globally available classes, so be careful when copying code from older
// tutorials.
const{api, sheets} = foundry.applications;

// -----------------------------------------------------------------------------
// TRAIT ITEM SHEET
// -----------------------------------------------------------------------------
//
// We are creating a custom sheet for a Tiny Supers Item.
//
// ItemSheetV2 already knows how to work with a Foundry Item Document, so
// we don't need to reinvent that functionality.
//
// We add Handlebars support using:
//
//     api.HandlebarsApplicationMixin(sheets.ItemSheetV2)
//
// Conceptually, the inheritance chain is:
//
//     ApplicationV2
//          ↑
//     ItemSheetV2
//          ↑
//     HandlebarsApplicationMixin
//          ↑
//     ItemTraitSheet
//
// This is an important ApplicationV2 pattern:
//
//     Use the most specialised Foundry Application class that already
//     understands the document you are displaying, then add the functionality
//     you need.
//
// In this case:
//     ItemSheetV2 = knows about Items
//     HandlebarsApplicationMixin = knows about Handlebars templates
//     ItemTraitSheet = adds our Tiny Supers-specific UI
export class ItemTraitSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {

  // ===========================================================================
  // DEFAULT OPTIONS
  // ===========================================================================
  //
  // ApplicationV2 applications are configured through DEFAULT_OPTIONS.
  //
  // Because this class extends ItemSheetV2, we start with the options provided
  // by the parent class and then override/add the options specific to our
  // Trait sheet.
  //
  // This line is important:
  //
  //     ...super.DEFAULT_OPTIONS
  //
  // The spread operator copies the parent's defaults into our options.
  //
  // Without this, we could accidentally discard configuration that
  // ItemSheetV2 expects.
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,

    // -------------------------------------------------------------------------
    // APPLICATION ID
    // -------------------------------------------------------------------------
    //
    // Unique ID for this ApplicationV2 window.
    //
    // This identifies the SHEET APPLICATION, not the underlying Item.
    //
    // The distinction is important:
    //
    //     tiny-supers-item-trait-sheet
    //         = Application ID
    //
    //     this.item.id
    //         = ID of the actual Foundry Item
    //
    // The application ID can also be useful as a CSS selector.
    id: "tiny-supers-item-trait-sheet",

    // -------------------------------------------------------------------------
    // CSS CLASSES
    // -------------------------------------------------------------------------
    //
    // Classes applied to this application's HTML element.
    //
    // "tiny-supers" gives us a general class for all of our system's
    // applications.
    //
    // "item-trait-sheet" lets us target Trait sheets specifically.
    //
    // This means CSS can be written specifically for this sheet without
    // accidentally changing every Item sheet in Foundry.
    classes: ["tiny-supers", "item-trait-sheet"],

    // -------------------------------------------------------------------------
    // ROOT HTML ELEMENT
    // -------------------------------------------------------------------------
    //
    // The root element of this Application will be a <form>.
    //
    // This is important because we are using ApplicationV2's built-in form
    // handling mechanism below.
    //
    // ApplicationV2 therefore manages the form lifecycle for us rather than
    // requiring us to manually attach a browser "submit" event listener.
    tag: "form",

    // -------------------------------------------------------------------------
    // APPLICATION WINDOW SIZE
    // -------------------------------------------------------------------------
    //
    // Initial dimensions of the Trait sheet window.
    //
    // These values are in pixels.
    //
    // This is the initial size; Foundry continues to manage the ApplicationV2
    // window itself.
    position: {
      width: 900,
      height: 1024
    },

    // -------------------------------------------------------------------------
    // FORM HANDLING
    // -------------------------------------------------------------------------
    //
    // ApplicationV2 provides a form-handling system.
    //
    // Instead of doing something like:
    //
    //     form.addEventListener("submit", ...)
    //
    // we tell ApplicationV2 which method should process the submission.
    //
    // The method is a private static method defined further down in this
    // class.
    form: {
      handler: ItemTraitSheet.#onSubmit,

      // -----------------------------------------------------------------------
      // SUBMIT ON CHANGE
      // -----------------------------------------------------------------------
      //
      // This option is currently commented out.
      //
      // If enabled, changing a form field can cause the form to be submitted
      // automatically.
      //
      // We don't currently need that behaviour, so it remains disabled.
      //
      // Keeping the line here is useful as a reminder that ApplicationV2
      // supports this behaviour if we ever want it.
      //
      // submitOnChange: false,


      // -----------------------------------------------------------------------
      // CLOSE ON SUBMIT
      // -----------------------------------------------------------------------
      //
      // We want the sheet to remain open after saving the Trait.
      //
      // Therefore:
      //
      //     false = submit/save the form but leave the window open.
      //
      // This is particularly useful when entering or correcting data because
      // the user doesn't have to reopen the sheet after every save.
      closeOnSubmit: false
    }
  };

  // ===========================================================================
  // APPLICATIONV2 PARTS
  // ===========================================================================
  //
  // ApplicationV2 applications are constructed from "parts".
  //
  // Each part is a named section of the application and normally points to
  // a Handlebars template.
  //
  // We only need one part for this sheet, called "body".
  //
  // "body" is simply the name we chose for the part. It is not a special
  // Tiny Supers or Foundry keyword.
  //
  // The actual HTML is contained in:
  //
  //     item-trait-sheet.hbs
  //
  // ApplicationV2 takes care of loading and rendering that template.
  //
  // IMPORTANT APPLICATIONV2 LESSON:
  //
  // We don't manually call renderTemplate() here and then inject the resulting
  // HTML into the window.
  //
  // Instead, we DECLARE the template in PARTS and ApplicationV2 manages the
  // rendering lifecycle.
  static PARTS = {
    body: {
      template: "systems/tiny-supers/templates/item-trait-sheet.hbs"
    }
  };

  // ===========================================================================
  // PREPARE THE HANDLEBARS CONTEXT
  // ===========================================================================
  //
  // Before ApplicationV2 renders the Handlebars template, it calls
  // _prepareContext().
  //
  // This method's job is to prepare the DATA that the template can use.
  //
  // This is the ApplicationV2 equivalent of the old Foundry API's getData()
  // pattern.
  //
  // Older Foundry examples often contain:
  //
  //     async getData()
  //
  // Don't automatically copy that pattern into an ApplicationV2 application.
  // ApplicationV2 uses _prepareContext().
  async _prepareContext(options) {

    // -------------------------------------------------------------------------
    // ASK THE PARENT SHEET TO PREPARE ITS CONTEXT FIRST
    // -------------------------------------------------------------------------
    //
    // ItemSheetV2 already knows how to prepare useful context for an Item.
    //
    // We therefore DON'T start with:
    //
    //     const context = {};
    //
    // Instead, we ask the parent class to prepare its normal context and then
    // add our own Tiny Supers-specific information.
    //
    // "await" is required because _prepareContext() is asynchronous.
    const context = await super._prepareContext(options);

    // -------------------------------------------------------------------------
    // MAKE THE ITEM AVAILABLE TO HANDLEBARS
    // -------------------------------------------------------------------------
    //
    // "this.item" is the actual Foundry Item Document being displayed by
    // this sheet.
    //
    // We expose it to the template as:
    //
    //     context.item
    //
    // This means the Handlebars template can use things such as:
    //
    //     {{item.name}}
    //
    // if it needs information from the complete Item Document.
    context.item = this.item;

    // -------------------------------------------------------------------------
    // MAKE THE SYSTEM DATA AVAILABLE DIRECTLY
    // -------------------------------------------------------------------------
    //
    // Foundry Documents contain their system-specific data under:
    //
    //     item.system
    //
    // For a Tiny Supers Trait this contains our custom fields, for example:
    //
    //     item.system.trait
    //     item.system.trait_desc
    //     item.system.trait_group
    //
    // We expose this as a separate "system" property in the template context.
    //
    // This means the Handlebars template can write:
    //
    //     {{system.trait}}
    //
    // rather than:
    //
    //     {{item.system.trait}}
    //
    // This is mainly a convenience that makes the template cleaner.
    context.system = this.item.system;

    // -------------------------------------------------------------------------
    // TELL THE TEMPLATE WHETHER THE SHEET IS EDITABLE
    // -------------------------------------------------------------------------
    //
    // ItemSheetV2 knows whether the current user is allowed to edit the Item.
    //
    // "this.isEditable" gives us that information.
    //
    // We pass it to Handlebars as:
    //
    //     context.editable
    //
    // The template can then use this to determine whether controls should be
    // editable or read-only.
    //
    // IMPORTANT:
    //
    // We don't need to implement our own permission checking here.
    //
    // Foundry already knows whether this sheet is editable, so we simply
    // expose that information to the template.
    context.editable = this.isEditable;

    // -------------------------------------------------------------------------
    // RETURN THE CONTEXT
    // -------------------------------------------------------------------------
    //
    // Everything returned here becomes available to the Handlebars template.
    //
    // We started with the context supplied by ItemSheetV2 and added:
    //
    //     item
    //     system
    //     editable
    //
    // This is the bridge between the JavaScript Application and the
    // Handlebars HTML template.
    return context;
  }

  // ===========================================================================
  // FORM SUBMISSION HANDLER
  // ===========================================================================
  //
  // This method is called by ApplicationV2 when the Trait form is submitted.
  //
  // It is:
  //
  //     static
  //
  // because it is registered as a class-level handler.
  //
  // It is:
  //
  //     async
  //
  // because updating a Foundry Document is asynchronous.
  //
  // It is:
  //
  //     #
  //
  // because it is a JavaScript private method. Only this class can directly
  // access it.
  //
  // ApplicationV2 passes three useful values:
  //
  //     event
  //         The submit event.
  //
  //     form
  //         The HTML <form> element.
  //
  //     formData
  //         Foundry's processed representation of the submitted form data.
  //
  // We only need formData for the actual update.
  static async #onSubmit(event, form, formData) {
    // -------------------------------------------------------------------------
    // NORMAL BROWSER FORM SUBMISSION
    // -------------------------------------------------------------------------
    //
    // In ordinary browser JavaScript you might call:
    //
    //     event.preventDefault();
    //
    // to prevent the browser from performing its default form submission.
    //
    // ApplicationV2 manages the submission lifecycle itself, so we don't
    // currently need to do this manually.
    //
    // This is left here as a reminder of the difference between a normal
    // browser form and an ApplicationV2-managed form.
    //
    // event.preventDefault();

    // -------------------------------------------------------------------------
    // UPDATE THE ACTUAL FOUNDRY ITEM
    // -------------------------------------------------------------------------
    //
    // THIS is where the submitted form becomes persistent Foundry data.
    //
    // Remember the important objects involved here:
    //
    //     form.object
    //         The actual Foundry Item Document.
    //
    //         NOTE: this is a STATIC method, so "this" is not the sheet
    //         instance and this.item would be undefined. form.object is
    //         the reliable way to reach the Document from here.
    //
    //     form
    //         The HTML <form> element.
    //
    //     formData.object
    //         The values submitted by the form, converted into an object
    //         that can be used for the update.
    //
    // Therefore:
    //
    //     form.object.update(formData.object)
    //
    // means:
    //
    //     "Take the values submitted by the form and update the actual
    //      Foundry Item Document."
    //
    // The important point is that we are NOT updating the HTML form here.
    //
    // We are updating the underlying Foundry Document.
    //
    // Foundry then handles validation, document updates, hooks, persistence,
    // and notifying the rest of the application that the Item has changed.
    await form.object.update(formData.object);

    // -------------------------------------------------------------------------
    // AN EARLIER EXPERIMENT
    // -------------------------------------------------------------------------
    //
    // During development we also tried:
    //
    //     await form.object.update(formData.object);
    //
    // The important lesson was to distinguish the FORM from the DOCUMENT.
    //
    // The sheet already gives us the actual Item through:
    //
    //     this.item
    //
    // That is the clearest and most direct object to update when this sheet
    // represents an Item.
    //
    // Keeping the old attempt commented here is useful because it records
    // something we tried while learning the ApplicationV2 API.
    //
    //await form.object.update(formData.object);
  }
}