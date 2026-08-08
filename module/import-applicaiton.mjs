import { TinySupersImporter } from "./importer.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TinySupersImportApplication extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        id: "tiny-supers-import",
        tag: "form",

        window: {
            title: "Tiny Supers Importer"
        },

        position: {
            width: 500,
            height: "auto"
        },

        form: {
            handler: this.#onSubmit
        }
    };

    static PARTS = {
        form: {
            template:
                "systems/tiny-supers/templates/import.hbs"
        }
    };

    async _prepareContext() {
        return {};
    }

    static async #onSubmit(event, form, formData) {

        const file = form.querySelector("input[type=file]").files[0];

        if (!file) {
            ui.notifications.warn("Please choose a file.");
            return;
        }

        await TinySupersImporter.import(file);

        ui.notifications.info("Import complete.");
    }

}