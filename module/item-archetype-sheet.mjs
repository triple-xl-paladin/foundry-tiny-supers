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

// module/actor-sheet.mjs
//
// This is the ApplicationV2 sheet used to display and edit a Tiny Supers
// Archetype Item.
//
// IMPORTANT APPLICATIONV2 CONCEPT:
//
// The sheet is NOT the Item.
//
// The Item is the actual Foundry Document containing the data:
//
//     Item
//       ├── name
//       ├── type
//       └── system
//             ├── archetype
//             ├── archetype_desc
//             └── etc.
//
// This class is the USER INTERFACE used to display and edit that Item.
//
// Think of it as:
//
//     ItemArchetypeSheet
//          |
//          | displays / edits
//          v
//     Item document
//
// This distinction becomes particularly important when handling form
// submission and deciding whether we are updating the form or updating
// the underlying Foundry Document.


// -----------------------------------------------------------------------------
// GET THE APPLICATIONV2 API
// -----------------------------------------------------------------------------
//
// Foundry v14 namespaces the ApplicationV2 classes under:
//
//     foundry.applications
//
// Rather than repeatedly writing:
//
//     foundry.applications.api
//     foundry.applications.sheets
//
// we destructure the two namespaces we need.
//
// "api" contains the general ApplicationV2 API, including:
//     HandlebarsApplicationMixin
//
// "sheets" contains the standard ApplicationV2 document sheet classes,
// including:
//     ItemSheetV2
//
// This namespaced API is part of the modern Foundry API and is preferable
// to relying on older global classes from pre-ApplicationV2 examples.
const{api, sheets} = foundry.applications;

// -----------------------------------------------------------------------------
// ITEM ARCHETYPE SHEET
// -----------------------------------------------------------------------------
//
// We want a standard Foundry Item sheet, but we want it rendered using
// Handlebars.
//
// Therefore we extend:
//
//     HandlebarsApplicationMixin(sheets.ItemSheetV2)
//
// This is the ApplicationV2 equivalent of building a custom Item sheet.
//
// ItemSheetV2 already knows how to work with a Foundry Item Document.
//
// The HandlebarsApplicationMixin adds the ability to define PARTS containing
// Handlebars templates.
//
// IMPORTANT:
//
// We are NOT extending ApplicationV2 directly here.
//
// ItemSheetV2 already provides the Item-specific functionality we need,
// including access to the Item through:
//
//     this.item
//
// So the inheritance chain is effectively:
//
//     ApplicationV2
//          ↑
//     ItemSheetV2
//          ↑
//     HandlebarsApplicationMixin
//          ↑
//     ItemArchetypeSheet
//
// This is a useful pattern to remember when creating sheets for other
// Foundry document types.
export class ItemArchetypeSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {

  // ===========================================================================
  // DEFAULT OPTIONS
  // ===========================================================================
  //
  // ApplicationV2 applications are configured through DEFAULT_OPTIONS.
  //
  // We start with all the options provided by ItemSheetV2 and then override
  // the ones specific to our Tiny Supers sheet.
  //
  // The spread operator:
  //
  //     ...super.DEFAULT_OPTIONS
  //
  // means:
  //
  //     "Copy all of the default options from the parent class into this
  //      application's options."
  //
  // This is IMPORTANT when subclassing Foundry's standard sheets.
  //
  // If we simply replaced DEFAULT_OPTIONS without including the parent's
  // defaults, we could accidentally lose configuration that ItemSheetV2
  // expects.
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,

    // -------------------------------------------------------------------------
    // APPLICATION ID
    // -------------------------------------------------------------------------
    //
    // Unique identifier for this Application.
    //
    // This is useful both to Foundry and for CSS selectors.
    //
    // For example, CSS could target:
    //
    //     #tiny-supers-item-archetype-sheet
    //
    // The ID is different from the Item's ID.
    //
    // IMPORTANT:
    //
    // This identifies the SHEET APPLICATION, not the underlying Item.
    id: "tiny-supers-item-archetype-sheet",

    // -------------------------------------------------------------------------
    // CSS CLASSES
    // -------------------------------------------------------------------------
    //
    // These classes are applied to the Application's HTML element.
    //
    // "tiny-supers" gives us a general system-level class.
    //
    // "item-archetype-sheet" lets us specifically target this type of sheet.
    //
    // This is preferable to styling every Foundry Item sheet globally.
    classes: ["tiny-supers", "item-archetype-sheet"],

    // -------------------------------------------------------------------------
    // ROOT HTML ELEMENT
    // -------------------------------------------------------------------------
    //
    // The root element of this Application will be a <form>.
    //
    // This is important because we are using ApplicationV2's form handling
    // system below.
    //
    // It means the HTML generated for this Application is effectively:
    //
    //     <form>
    //         ...
    //     </form>
    //
    // rather than the default container element.
    tag: "form",

    // -------------------------------------------------------------------------
    // WINDOW SIZE
    // -------------------------------------------------------------------------
    //
    // Initial size of the ApplicationV2 window.
    //
    // These are pixels.
    //
    // This is only the INITIAL size; Foundry still manages the application
    // window itself.
    position: {
      width: 900,
      height: 1024
    },

    // -------------------------------------------------------------------------
    // FORM HANDLING
    // -------------------------------------------------------------------------
    //
    // ApplicationV2 provides a standard form submission mechanism.
    //
    // Instead of manually doing:
    //
    //     form.addEventListener("submit", ...)
    //
    // we tell ApplicationV2 which method should handle submission.
    form: {
      handler: ItemArchetypeSheet.#onSubmit,

      // -----------------------------------------------------------------------
      // submitOnChange
      // -----------------------------------------------------------------------
      //
      // This option is currently commented out.
      //
      // If enabled, changing a form field can cause the form to be submitted
      // automatically rather than waiting for the user to explicitly submit.
      //
      // We currently don't want that behaviour, so it is left disabled.
      //
      // submitOnChange: false,

      // -----------------------------------------------------------------------
      // closeOnSubmit
      // -----------------------------------------------------------------------
      //
      // By default, a submitted Application may close depending on the
      // application's configuration.
      //
      // We explicitly don't want this sheet to disappear after the user
      // saves their changes.
      //
      // Therefore:
      //
      //     false = submit the form, but keep the sheet open.
      closeOnSubmit: false
    }
  };

  // ===========================================================================
  // PARTS
  // ===========================================================================
  //
  // ApplicationV2 applications are built from PARTS.
  //
  // A part is a named section of the Application which is rendered using
  // a template.
  //
  // Here we have one part called "body".
  //
  // The name "body" is our identifier for the part. It doesn't mean that
  // Foundry requires the part to be called "body"; we could choose another
  // name.
  //
  // The actual HTML lives in:
  //
  //     item-archetype-sheet.hbs
  //
  // ApplicationV2 handles rendering that template into the application.
  //
  // IMPORTANT LESSON FROM APPLICATIONV2:
  //
  // We don't manually:
  //
  //     renderTemplate(...)
  //
  // and then insert the HTML ourselves.
  //
  // We declare the template in PARTS and let ApplicationV2 manage its
  // rendering lifecycle.
  static PARTS = {
    body: {
      template: "systems/tiny-supers/templates/item-archetype-sheet.hbs"
    }
  };

  // ===========================================================================
  // PREPARE HANDLEBARS CONTEXT
  // ===========================================================================
  //
  // ApplicationV2 calls _prepareContext() before rendering the Handlebars
  // template.
  //
  // Its job is to prepare the data that the template will be able to access.
  //
  // This is one of the major differences from older Foundry sheet examples.
  //
  // In older APIs you will often see:
  //
  //     getData()
  //
  // In ApplicationV2, _prepareContext() is the equivalent place to prepare
  // the template context.
  //
  // The "options" parameter is supplied by ApplicationV2.
  async _prepareContext(options) {
    // -------------------------------------------------------------------------
    // GET THE PARENT CONTEXT FIRST
    // -------------------------------------------------------------------------
    //
    // This is IMPORTANT because ItemSheetV2 already prepares useful context
    // for us.
    //
    // We don't want to throw away everything the parent class provides.
    //
    // Instead:
    //
    //     await super._prepareContext(options)
    //
    // asks ItemSheetV2 to prepare its normal context first.
    //
    // We then add our own Tiny Supers-specific values to it.
    const context = await super._prepareContext(options);

    // -------------------------------------------------------------------------
    // MAKE THE ITEM AVAILABLE TO HANDLEBARS
    // -------------------------------------------------------------------------
    //
    // "this.item" is the actual Foundry Item Document that this sheet is
    // displaying.
    //
    // We explicitly put it into the template context as:
    //
    //     context.item
    //
    // This means the Handlebars template can access it using:
    //
    //     {{item}}
    //
    // or properties such as:
    //
    //     {{item.name}}
    //
    // depending on what the template needs.
    context.item = this.item;

    // -------------------------------------------------------------------------
    // MAKE THE ITEM'S SYSTEM DATA AVAILABLE
    // -------------------------------------------------------------------------
    //
    // Every Foundry Document has a "system" property containing the data
    // defined by the system's data model.
    //
    // For our Archetype Item this contains things such as:
    //
    //     item.system.archetype
    //     item.system.archetype_desc
    //     item.system.stress
    //     item.system.archetype_trait
    //
    // We expose this separately as "system" because it makes the Handlebars
    // template much cleaner.
    //
    // Instead of:
    //
    //     {{item.system.archetype}}
    //
    // the template can use:
    //
    //     {{system.archetype}}
    //
    // This is primarily a convenience for the template.
    context.system = this.item.system;

    // -------------------------------------------------------------------------
    // TELL THE TEMPLATE WHETHER THE SHEET IS EDITABLE
    // -------------------------------------------------------------------------
    //
    // ApplicationV2 / ItemSheetV2 knows whether the current sheet is allowed
    // to edit the underlying Item.
    //
    // "this.isEditable" gives us that information.
    //
    // We expose it to Handlebars as:
    //
    //     context.editable
    //
    // The template can then use it to decide whether fields should be
    // editable or read-only.
    //
    // This is preferable to trying to determine edit permissions ourselves.
    //
    // Foundry already knows the answer.
    context.editable = this.isEditable;

    // -------------------------------------------------------------------------
    // RETURN THE COMPLETE TEMPLATE CONTEXT
    // -------------------------------------------------------------------------
    //
    // Everything returned here becomes available to the Handlebars template.
    //
    // Our context now contains the normal ItemSheetV2 context PLUS:
    //
    //     item
    //     system
    //     editable
    //
    // This is the data bridge between the JavaScript Application and the
    // Handlebars HTML template.
    return context;
  }
  // ===========================================================================
  // FORM SUBMISSION HANDLER
  // ===========================================================================
  //
  // This method is called by ApplicationV2 when the form is submitted.
  //
  // It is:
  //
  //     static
  //
  // because the handler is registered on the class rather than requiring
  // an application instance method.
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
  // because this is a JavaScript private method. Only this class can directly
  // refer to it.
  //
  // ApplicationV2 passes:
  //
  //     event
  //     form
  //     formData
  //
  // We use formData, because Foundry has already converted the submitted
  // form into a useful object for us.
  static async #onSubmit(event, form, formData) {
    console.log("Submitting item archetype handler called");
    console.log(form.object);

    // -------------------------------------------------------------------------
    // PREVENT DEFAULT BROWSER SUBMISSION
    // -------------------------------------------------------------------------
    //
    // We experimented with this while learning ApplicationV2.
    //
    // In a normal browser form you might use:
    //
    //     event.preventDefault();
    //
    // to stop the browser performing its normal form submission.
    //
    // ApplicationV2 is already managing the form submission lifecycle for us,
    // so this isn't currently needed.
    //
    // Leaving it commented here records that distinction between normal
    // browser forms and Foundry ApplicationV2 forms.
    //
    // event.preventDefault();

    console.log(formData.object);

    // -------------------------------------------------------------------------
    // UPDATE THE UNDERLYING FOUNDRY ITEM
    // -------------------------------------------------------------------------
    //
    // THIS IS THE IMPORTANT PART.
    //
    // The sheet itself is NOT the data.
    //
    // "this.item" is the actual Foundry Item Document being edited.
    //
    // "formData.object" contains the submitted values converted into an
    // object suitable for updating the Document.
    //
    // Therefore:
    //
    //     this.item.update(formData.object)
    //
    // means:
    //
    //     "Take the values submitted by the form and update the actual
    //      Foundry Item Document with them."
    //
    // This is fundamentally different from updating the HTML form itself.
    //
    // Once the update completes, Foundry owns the new data and the Item
    // Document has been persisted.
    await this.item.update(formData.object);

    // -------------------------------------------------------------------------
    // WHY NOT form.object.update()?
    // -------------------------------------------------------------------------
    //
    // We experimented with:
    //
    //     form.object.update(formData.object);
    //
    // and it is useful to understand why we ultimately use this.item instead.
    //
    // "form" is the HTML <form> element.
    //
    // "form.object" is related to Foundry's form/application machinery, but
    // it is not the clearest or most reliable reference to use when our
    // intention is specifically:
    //
    //     "Update the Item represented by this sheet."
    //
    // ItemSheetV2 explicitly provides:
    //
    //     this.item
    //
    // as the Item Document associated with the sheet.
    //
    // Therefore:
    //
    //     this.item.update(...)
    //
    // clearly expresses what we actually mean and avoids confusing the
    // HTML form with the underlying Foundry Document.
    //
    // The old experiment is retained below as a reminder of what we tried:
    //
    //await form.object.update(formData.object);
  }
}