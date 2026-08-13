// Import the actual Tiny Supers dice-rolling function.
//
// IMPORTANT DESIGN DECISION:
//
// This Application is responsible for the USER INTERFACE only.
//
// The actual dice mechanics live separately in:
//
//     models/dice.mjs
//
// This means this class doesn't need to know HOW Tiny Supers dice work.
// It only needs to know:
//
//     "The user clicked the button — ask the dice roller to roll."
//
// This is the same separation of responsibilities we used with the importer.
import { rollTinySupers } from "./models/dice.mjs";

// -----------------------------------------------------------------------------
// ACCESS THE APPLICATIONV2 API
// -----------------------------------------------------------------------------
//
// This is a standalone ApplicationV2 window rather than a document sheet.
//
// Therefore we extend ApplicationV2 directly, adding Handlebars support with
// HandlebarsApplicationMixin.
//
// Unlike the Item sheets, there is no ItemSheetV2 here because this window
// isn't displaying or editing a Foundry Document.
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// -----------------------------------------------------------------------------
// TINY SUPERS DICE ROLLER
// -----------------------------------------------------------------------------
//
// This is a standalone floating ApplicationV2 window.
//
// The important distinction from our Item sheets is:
//
//     ItemTraitSheet
//         extends ItemSheetV2
//         → represents a Foundry Item
//
//     TinySupersDiceRoller
//         extends ApplicationV2
//         → represents a standalone application/window
//
// There is no:
//
//     this.item
//
// because this application isn't attached to an Item, Actor, or other
// Foundry Document.
//
// It simply provides a user interface for rolling Tiny Supers dice.
export class TinySupersDiceRoller extends HandlebarsApplicationMixin(ApplicationV2) {

  // ===========================================================================
  // DEFAULT OPTIONS
  // ===========================================================================
  //
  // ApplicationV2 configuration belongs in DEFAULT_OPTIONS.
  //
  // Because this is a direct ApplicationV2 subclass rather than a specialised
  // document sheet, there is no need for:
  //
  //     ...super.DEFAULT_OPTIONS
  //
  // here unless we specifically want to override/extend inherited options.
  static DEFAULT_OPTIONS = {

    // -------------------------------------------------------------------------
    // CSS CLASSES
    // -------------------------------------------------------------------------
    //
    // Classes applied to this application's HTML element.
    //
    // "tiny-supers" is the general system class.
    //
    // "dice-roller" identifies this particular application so that CSS can
    // style it without affecting other Tiny Supers applications.
    classes: ["tiny-supers", "dice-roller"],

    // -------------------------------------------------------------------------
    // APPLICATION WINDOW
    // -------------------------------------------------------------------------
    //
    // Configure the Foundry application window itself.
    //
    // This is separate from the Handlebars template.
    //
    // The template controls the CONTENT inside the window.
    //
    // ApplicationV2 controls the WINDOW containing that content.
    window: {
      // Text displayed in the window's title bar.
      title: "Tiny Supers Dice",

      // -----------------------------------------------------------------------
      // WINDOW CONTROLS
      // -----------------------------------------------------------------------
      //
      // Foundry normally provides controls in the application's window header.
      //
      // Setting:
      //
      //     controls: []
      //
      // removes the controls we don't want for this very simple utility
      // window.
      //
      // This is useful for small applications where the normal ApplicationV2
      // window controls would just add clutter.
      controls: []
    },

    // -------------------------------------------------------------------------
    // INITIAL WINDOW SIZE
    // -------------------------------------------------------------------------
    //
    // The initial dimensions of the dice roller window.
    //
    // This application is deliberately small because it only contains a few
    // buttons.
    position: {
      width: 300,
      height: 200
    }
  };

  // ===========================================================================
  // APPLICATIONV2 PARTS
  // ===========================================================================
  //
  // ApplicationV2 applications are composed of PARTS.
  //
  // Each part is associated with a template.
  //
  // We only need one part here, called "main".
  //
  // "main" is simply the name we chose for the part. It isn't required to
  // have this name.
  //
  // The actual HTML for the dice roller lives in:
  //
  //     templates/dice-roller.hbs
  //
  // ApplicationV2 takes responsibility for rendering this template into the
  // application.
  //
  // IMPORTANT APPLICATIONV2 LESSON:
  //
  // We don't manually call renderTemplate() and insert the resulting HTML.
  //
  // We declare the template through PARTS and ApplicationV2 manages the
  // rendering lifecycle.
  static PARTS = {
    main: {
      template: "systems/tiny-supers/templates/dice-roller.hbs"
    }
  };

  // ===========================================================================
  // ON RENDER
  // ===========================================================================
  //
  // _onRender() is an ApplicationV2 lifecycle method.
  //
  // It is called after the application has rendered its HTML.
  //
  // This is an important distinction:
  //
  //     _prepareContext()
  //         → prepares DATA
  //
  //     ApplicationV2 renders the template
  //
  //     _onRender()
  //         → HTML now exists, so we can work with the DOM
  //
  // This makes _onRender() a good place to attach event listeners to elements
  // that were created by the Handlebars template.
  //
  // IMPORTANT:
  //
  // We couldn't reliably find the buttons during _prepareContext() because
  // the template hasn't been rendered into the DOM at that point.
  async _onRender(context, options) {

    // Always allow the parent ApplicationV2 implementation to run first.
    //
    // This is important when overriding lifecycle methods. The parent may
    // perform work that ApplicationV2 itself requires.
    super._onRender(context, options);

    // -------------------------------------------------------------------------
    // FIND ALL DICE ROLL BUTTONS
    // -------------------------------------------------------------------------
    //
    // Our Handlebars template uses the data attribute:
    //
    //     data-roll
    //
    // on buttons that should trigger dice rolls.
    //
    // For example, the template might contain something like:
    //
    //     <button data-roll="normal">Normal</button>
    //     <button data-roll="advantage">Advantage</button>
    //     <button data-roll="disadvantage">Disadvantage</button>
    //
    // querySelectorAll() searches the rendered application DOM for all
    // elements matching:
    //
    //     [data-roll]
    //
    // In other words:
    //
    //     "Find every element that has a data-roll attribute."
    //
    // IMPORTANT:
    //
    // We search from:
    //
    //     this.element
    //
    // rather than:
    //
    //     document
    //
    // because this application owns its own DOM element.
    //
    // Restricting the search to this application prevents us from accidentally
    // finding similarly named buttons elsewhere in Foundry.
    this.element.querySelectorAll("[data-roll]")
      // Convert the NodeList returned by querySelectorAll() into a series of
      // operations using forEach().
      //
      // Each matching button gets its own click event listener.
      .forEach(button => {
        // ---------------------------------------------------------------------
        // BUTTON CLICK HANDLER
        // ---------------------------------------------------------------------
        //
        // When a dice button is clicked, this function is called.
        //
        // "event.currentTarget" is the button on which this listener was
        // registered.
        //
        // This is preferable to event.target here because the button might
        // contain another HTML element, such as a <span> or icon.
        //
        // currentTarget means:
        //
        //     "The element whose event listener is currently handling this
        //      event."
        button.addEventListener("click", event => {

          // -------------------------------------------------------------------
          // READ THE DATA ATTRIBUTE
          // -------------------------------------------------------------------
          //
          // HTML data attributes are available through the element's dataset.
          //
          // For:
          //
          //     <button data-roll="advantage">
          //
          // JavaScript sees:
          //
          //     button.dataset.roll
          //
          // Therefore this retrieves whichever roll type was assigned to
          // the button in the Handlebars template.
          //
          // Examples:
          //
          //     "normal"
          //     "advantage"
          //     "disadvantage"
          const type = event.currentTarget.dataset.roll;

          // -------------------------------------------------------------------
          // PERFORM THE ACTUAL ROLL
          // -------------------------------------------------------------------
          //
          // The UI doesn't implement the dice rules itself.
          //
          // It simply passes the requested roll type to the dice model:
          //
          //     rollTinySupers(type)
          //
          // This keeps the game rules separate from the Application UI.
          //
          // The flow is therefore:
          //
          //     Button
          //       ↓
          //     data-roll="advantage"
          //       ↓
          //     type = "advantage"
          //       ↓
          //     rollTinySupers("advantage")
          //
          // The dice module then decides what "advantage" actually means.
          rollTinySupers(type);
        });
      });
  }

  // ===========================================================================
  // PREPARE TEMPLATE CONTEXT
  // ===========================================================================
  //
  // ApplicationV2 calls _prepareContext() before rendering the template.
  //
  // In this application we currently don't need to supply any data to the
  // Handlebars template.
  //
  // Therefore we simply return an empty object.
  //
  // IMPORTANT:
  //
  // This method exists because it is part of the normal ApplicationV2
  // rendering lifecycle.
  //
  // If the dice roller later needs dynamic information, such as:
  //
  //     the current Actor
  //     the last roll
  //     a selected difficulty
  //     modifiers
  //
  // this is where we could prepare that data for Handlebars.
  async _prepareContext() {
    console.log("Dice roller context");

    // No data is currently required by dice-roller.hbs.
    return {};
  }

  // ===========================================================================
  // FIRST RENDER
  // ===========================================================================
  //
  // _onFirstRender() is another ApplicationV2 lifecycle method.
  //
  // The important word here is FIRST.
  //
  // Unlike _onRender(), which can run whenever the application is rendered,
  // _onFirstRender() is intended for work that should happen only once,
  // when the application is initially rendered.
  //
  // This makes it useful for one-time setup of the application window.
  async _onFirstRender(context, options) {
    // Give the parent ApplicationV2 implementation a chance to perform its
    // own first-render processing.
    //
    // Because this method is asynchronous, we await it.
    await super._onFirstRender(context, options);
    console.log(this.window);

    // -------------------------------------------------------------------------
    // REMOVE THE CLOSE BUTTON
    // -------------------------------------------------------------------------
    //
    // ApplicationV2 normally creates standard window controls, including the
    // close button.
    //
    // We want this dice roller to behave like a very simple utility window,
    // so we remove the close control.
    //
    // "this.window" represents the ApplicationV2 window.
    //
    // "this.window.close" is the close control in the window header.
    //
    // Calling:
    //
    //     remove()
    //
    // removes that DOM element from the window.
    //
    // IMPORTANT:
    //
    // This is DOM manipulation, so it needs to happen AFTER the window has
    // actually been rendered.
    //
    // That is why this code belongs in _onFirstRender(), rather than
    // _prepareContext().
    this.window.close.remove();
    }
}