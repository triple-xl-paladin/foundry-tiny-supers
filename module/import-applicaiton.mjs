// Import the class that contains the actual Tiny Supers import logic.
//
// IMPORTANT DESIGN DECISION:
// The Application is responsible for the USER INTERFACE.
// TinySupersImporter is responsible for DOING THE IMPORT.
//
// Keeping these separate means this window doesn't need to know how the
// JSON is parsed, how Actors/Items are created, etc. It simply gets a file
// from the user and passes it to the importer.
import {TinySupersImporter} from "./importer.mjs";

// ---------------------------------------------------------------------------
// FOUNDry VTT APPLICATION V2
// ---------------------------------------------------------------------------
//
// ApplicationV2 is Foundry's newer application framework.
//
// This is different from the older Application API that a lot of Foundry
// examples still use. In ApplicationV2:
//
//   - ApplicationV2 provides the application/window lifecycle.
//   - HandlebarsApplicationMixin adds Handlebars template rendering.
//   - DEFAULT_OPTIONS describes how the application behaves.
//   - PARTS describes which Handlebars templates make up the UI.
//   - _prepareContext() supplies data to those templates.
//   - Form handlers deal with user-submitted form data.
//
// One of the things that caused confusion while learning this was that
// ApplicationV2 is NOT simply "the old Application class with a new name".
// It has a different way of defining and rendering applications.
//
// foundry.applications.api is where Foundry exposes these application
// classes. We destructure the two classes we need here so the code below
// is easier to read.
const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;

// ---------------------------------------------------------------------------
// APPLICATION CLASS
// ---------------------------------------------------------------------------
//
// We want a normal Foundry ApplicationV2 window, but we also want it to use
// a Handlebars template.
//
// HandlebarsApplicationMixin adds that Handlebars functionality to
// ApplicationV2.
//
// The order is important:
//
//     HandlebarsApplicationMixin(ApplicationV2)
//
// means:
//
//     "Take ApplicationV2 and add the Handlebars application functionality
//      to it."
//
// This is why our class ultimately behaves as an ApplicationV2 while also
// understanding PARTS containing Handlebars templates.
//
// This pattern is used throughout modern Foundry VTT ApplicationV2 code.
export class TinySupersImportApplication extends HandlebarsApplicationMixin(ApplicationV2) {

  // -------------------------------------------------------------------------
  // DEFAULT_OPTIONS
  // -------------------------------------------------------------------------
  //
  // ApplicationV2 applications are configured using DEFAULT_OPTIONS.
  //
  // This replaces much of the configuration that older Foundry Application
  // classes used to do in their constructor or through other properties.
  //
  // "static" is important here:
  //
  // DEFAULT_OPTIONS describes the CLASS rather than an individual instance.
  // Foundry reads these options when it constructs the application.
  //
  // The options are merged with Foundry's own ApplicationV2 defaults.
  static DEFAULT_OPTIONS = {

    // The HTML/application ID.
    //
    // This should be unique to this application. It is also useful when
    // writing CSS, because the application can be identified in the DOM.
    //
    // In this case:
    //
    //     #tiny-supers-import
    //
    // can be used to target this application with CSS if necessary.
    id: "tiny-supers-import",

    // Tell ApplicationV2 that the application's root element should be
    // a <form>.
    //
    // This is important because our application contains a file input and
    // uses the ApplicationV2 form-handling mechanism.
    //
    // ApplicationV2 is quite particular about the relationship between
    // "tag", PARTS and form handling. The root element being a form means
    // that the form handler below receives the submitted form.
    tag: "form",

    // -----------------------------------------------------------------------
    // WINDOW
    // -----------------------------------------------------------------------
    //
    // Configure the Foundry application window itself.
    //
    // "title" is the title displayed in the application's window header.
    //
    // Notice that this is NOT part of the Handlebars template. The window
    // chrome (title bar, close button, etc.) is managed by ApplicationV2.
    window: {
      title: "Tiny Supers Importer"
    },

    // -----------------------------------------------------------------------
    // POSITION / SIZE
    // -----------------------------------------------------------------------
    //
    // Set the initial dimensions of the application.
    //
    // width: 500 means 500 pixels wide.
    //
    // height: "auto" tells Foundry to allow the height to be determined by
    // the contents rather than forcing a fixed height.
    //
    // This is useful for small utility windows where we don't know exactly
    // how tall the template will be.
    position: {
      width: 500,
      height: "auto"
    },

    // -----------------------------------------------------------------------
    // FORM HANDLING
    // -----------------------------------------------------------------------
    //
    // ApplicationV2 has its own form-handling system.
    //
    // Instead of adding a normal DOM submit event listener ourselves, we
    // tell ApplicationV2 which method should handle the form submission.
    //
    // The handler receives:
    //
    //     event
    //         The browser submit event.
    //
    //     form
    //         The actual <form> element.
    //
    //     formData
    //         Foundry's representation of the submitted form data.
    //
    // We don't actually need formData here because a file input is easier
    // to access directly from the form element.
    //
    // IMPORTANT ApplicationV2 LESSON:
    //
    // The handler is a static private method, hence:
    //
    //     this.#onSubmit
    //
    // rather than:
    //
    //     this.onSubmit
    //
    // Private methods beginning with # are real JavaScript private methods.
    // They can ONLY be accessed from within the class that defines them.
    //
    // Foundry can still call this function because we give Foundry the
    // function reference here.
    form: {
      handler: this.#onSubmit
    }
  };

  // -------------------------------------------------------------------------
  // PARTS
  // -------------------------------------------------------------------------
  //
  // This is one of the biggest differences from the older Foundry
  // Application API.
  //
  // ApplicationV2 applications are composed of one or more "parts".
  //
  // A PART is essentially a named piece of the application's UI which is
  // rendered from a template.
  //
  // Here we have only one part, called "form".
  //
  // The name "form" is our identifier for this part. It is NOT automatically
  // the same thing as the HTML <form> element, although in this application
  // the application itself is also configured with tag: "form".
  //
  // The template contains the actual HTML controls that the user sees.
  //
  // IMPORTANT APPLICATIONV2 LESSON:
  //
  // When using HandlebarsApplicationMixin, the template is not simply
  // rendered by calling something like:
  //
  //     await renderTemplate(...)
  //
  // and inserting the result ourselves.
  //
  // Instead, ApplicationV2 knows from PARTS which templates it needs to
  // render and manages that lifecycle for us.
  static PARTS = {
    form: {
      template:
        "systems/tiny-supers/templates/import.hbs"
    }
  };

  // -------------------------------------------------------------------------
  // PREPARE TEMPLATE CONTEXT
  // -------------------------------------------------------------------------
  //
  // ApplicationV2 calls _prepareContext() when it needs the data that will
  // be supplied to the Handlebars templates.
  //
  // For example, if we returned:
  //
  //     return {
  //       actorName: "Bob"
  //     };
  //
  // then import.hbs could use:
  //
  //     {{actorName}}
  //
  // We don't currently need to provide any data to the template because
  // the importer window is just a file picker.
  //
  // Nevertheless, ApplicationV2 expects this method as part of the normal
  // application lifecycle, so we return an empty object.
  //
  // IMPORTANT LESSON:
  //
  // Don't confuse this with the old Application API's getData().
  //
  // In ApplicationV2, _prepareContext() is the equivalent place where we
  // prepare data that templates need.
  async _prepareContext() {
    return {};
  }

  // -------------------------------------------------------------------------
  // FORM SUBMISSION HANDLER
  // -------------------------------------------------------------------------
  //
  // This is where the UI hands control over to the actual importer.
  //
  // The method is:
  //
  //     static async #onSubmit(...)
  //
  // "static" means this method belongs to the class rather than an
  // individual application instance.
  //
  // "#" means it is a JavaScript private method.
  //
  // "async" is required because TinySupersImporter.import() is asynchronous
  // and we need to wait for it to finish before telling the user that the
  // import is complete.
  //
  // ApplicationV2 supplies three arguments to the handler:
  //
  //     event
  //     form
  //     formData
  //
  // We only need "form", so event and formData are intentionally unused.
  static async #onSubmit(event, form, formData) {

    // -----------------------------------------------------------------------
    // GET THE SELECTED FILE
    // -----------------------------------------------------------------------
    //
    // The HTML template contains a file input, presumably something like:
    //
    //     <input type="file">
    //
    // The browser stores the files selected by the user in the input's
    // .files collection.
    //
    // [0] gets the first selected file.
    //
    // Therefore this line effectively means:
    //
    //     "Find the file input in our form and give me the first file
    //      selected by the user."
    //
    // querySelector() is being used on "form", rather than on the whole
    // document. This is important because it limits the search to this
    // application's form.
    const file = form.querySelector("input[type=file]").files[0];

    // -----------------------------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------------------------
    //
    // If the user pressed Import without selecting a file, .files[0] will
    // be undefined.
    //
    // We don't want to call the importer with an undefined file, so stop
    // here and tell the user what went wrong.
    //
    // "return" is important: it prevents the code below from continuing.
    if (!file) {
      ui.notifications.warn("Please choose a file.");
      return;
    }

    // -----------------------------------------------------------------------
    // DO THE ACTUAL IMPORT
    // -----------------------------------------------------------------------
    //
    // The Application does NOT perform the import itself.
    //
    // This is another deliberate separation of responsibilities:
    //
    //     TinySupersImportApplication
    //          |
    //          | gets file from user
    //          v
    //     TinySupersImporter.import(file)
    //          |
    //          | parses JSON / creates documents / etc.
    //          v
    //     Foundry
    //
    // "await" is important because import() is asynchronous.
    //
    // If we didn't await it, the next line could execute immediately and
    // display "Import complete" before the importer had actually finished.
    await TinySupersImporter.import(file);

    // Tell the user that the asynchronous import has completed.
    //
    // Foundry's ui.notifications API provides the standard notification
    // system rather than us having to create our own message in the DOM.
    ui.notifications.info("Import complete.");
  }

}