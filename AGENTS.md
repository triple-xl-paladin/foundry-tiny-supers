# AGENTS.md

Guidance for AI agents (and humans) working on the Tiny Supers Foundry VTT system.

## Project overview

A Foundry VTT **v14** system for the Tiny Supers game (Tiny D6 engine). All code uses the modern **ApplicationV2** API — there is no legacy `Application` code. The codebase is heavily commented as a learning reference for v13/v14 migration patterns; preserve that style when adding code.

## Repository layout

```
tiny-supers.mjs                    System entry point (init/setup/ready hooks)
system.json                        Manifest (esmodules, styles, documentTypes)
module/
  models/
    actor.mjs                      SuperHero TypeDataModel (Actor type "hero")
    dice.mjs                       rollTinySupers() — dice rules, no UI
    item-archetype-model.mjs       Archetype TypeDataModel (Item type "archetype")
    item-trait-model.mjs           Trait TypeDataModel (Item type "trait")
  actor-sheet.mjs                  SuperHeroSheet (ActorSheetV2)
  item-archetype-sheet.mjs         ItemArchetypeSheet (ItemSheetV2)
  item-trait-sheet.mjs             ItemTraitSheet (ItemSheetV2)
  tiny-supers-dice-roller.mjs      Standalone ApplicationV2 dice window
  tiny-supers-chat-controls.mjs    Injects dice buttons into Chat Log (renderChatLog hook)
  import-application.mjs           Import dialog (ApplicationV2 form)
  importer.mjs                     TinySupersImporter — JSON → compendium logic
templates/                         Handlebars templates (one per sheet/app)
styles/tiny-supers.css             System CSS, scoped under .tiny-supers.*
```

## Architecture rules

- **Data models are `TypeDataModel`, not Document subclasses.** Never extend `Actor` or `Item` directly. The custom data lives in `document.system`, described by `defineSchema()`.
- **Item types are `"archetype"` and `"trait"`** (singular). Actor type is `"hero"`. These keys must stay in sync across three places:
  1. `system.json` → `documentTypes`
  2. `tiny-supers.mjs` → `CONFIG.Actor.dataModels.<type>` / `CONFIG.Item.dataModels.<type>`
  3. The `type:` string used in imports, drops, and `createDocuments` calls
- **Traits and archetype are Item documents embedded in the Actor**, not fields on `actor.system`. The sheet reads them via `actor.items.contents.filter(item => item.type === "trait")` etc. The old `trait1`/`trait2`/`trait3` fields were removed from the schema and must not be reintroduced.
- **`stress` is a `NumberField`** on both the Actor (current) and the Archetype Item (maximum). The sheet derives `maxStress` from the archetype — do not copy the max into the Actor (single source of truth).
- **Dice rules live in `module/models/dice.mjs`** (`rollTinySupers(type, actor)`). UI code (dice-roller, chat-controls) only passes the roll type — never compute dice in the UI layer.
- **Importer is separate from the import Application.** `TinySupersImporter` (data) vs `TinySupersImportApplication` (UI). Keep that split.
- **Compendium creation pattern:** `game.packs.get("world.<name>")` → create if missing via `foundry.documents.collections.CompendiumCollection.createCompendium`. World packs are namespaced `world.*`, not `<system-id>.*`.
- **Sheet event pattern:** validate in the subclass, then call `super` to let Foundry do the document work (see `_onDropItem`).

## Foundry v14 API notes (things that bite)

- Collections are `foundry.documents.collections.Actors` / `.Items` / `.CompendiumCollection` — not the old globals.
- ApplicationV2: `HandlebarsApplicationMixin(App)` + `static DEFAULT_OPTIONS` + `static PARTS` + `async _prepareContext()`.
- Sheet registration: `Actors.registerSheet("tiny-supers", Sheet, { types: ["hero"], makeDefault: true })`. Unregister the core sheet first for Actor.
- Form handlers are **static** methods: `static async #onSubmit(event, form, formData)`. Inside a static handler, `this` is **not** the application instance. `form` is the HTML `<form>` element, NOT the application. `formData` is a `FormDataExtended` whose `.object` is **flat** (dot-notation keys like `"system.stress": 0`), so pass it through `foundry.utils.expandObject()` before calling `update()`. Reach the Document via `event.currentTarget.closest(".application")` → `foundry.applications.instances.get(id)` → `app.actor` (ActorSheetV2) or `app.item` (ItemSheetV2).
- **ApplicationV2 instances** live in `foundry.applications.instances` (a `Map` keyed by element ID). Use this to reach a live sheet from anywhere.
- **`setPosition()`** takes a single position **object**: `this.setPosition({ left, top })`, not separate parameters.
- **Dice-roller window position** is percentage-of-viewport (43.6% left, 82.3% top), set in `_onFirstRender` via `setTimeout` (50 ms) to defer past Foundry's layout pass. Guarded by `this._positioned` so it only fires once.
- **Chat-log dice buttons** are injected via `renderChatLog` hook + a `MutationObserver` on `#ui-right` to re-anchor when Foundry moves `#chat-message` (sidebar open/close does not fire `renderChatLog`).
- `renderChatLog` hook for Chat Log DOM injection; `Hooks.once` is fine for one-shot UI work.
- `roll.dice[0].results` is per-dice-term; current formulas (1d6/2d6/3d6) have one term, but don't assume it.

## Known issues (do not "fix" by reverting; fix in place)

1. `importer.mjs` — actor import uses `type: "superhero"`; must be `"hero"`.
2. `importer.mjs` — actor import writes `trait1/2/3` into `system`; those fields no longer exist in the schema.
3. All four sheet `#onSubmit` handlers reference `this.item` / `this.actor` — undefined in static context.
4. Dice calls never pass an `actor`, so chat rolls are anonymous.
5. `import-applicaiton.mjs` filename typo.
6. No import deduplication; re-importing duplicates compendium docs.
7. `opencode.jsonc` (dev MCP config) is untracked — add to `.gitignore`.

**Status (as of the v1.0.0 cleanup):** all seven items above have been
addressed — the importer now uses `type: "hero"` and drops the dead
`trait1/2/3` fields, the three `#onSubmit` handlers use `form.object`
instead of `this`, `rollTinySupers()` falls back to `game.user?.character`
for the chat speaker, the file is renamed `import-application.mjs`, imports
upsert (create-or-update by name + type) so re-importing does not
duplicate, and `opencode.jsonc` is in `.gitignore`. They are kept in the
list as a historical record of what the review found; do not re-introduce
any of these problems when refactoring.

## Conventions

- **Comments stay.** This repo doubles as a teaching reference. New code should carry the same explanatory comment density (section banners, "IMPORTANT" callouts, why-not explanations). Don't strip comments when editing.
- **License headers** are required on every source file (GPL-3.0 block at top).
- **No build step.** Plain `.mjs` ES modules, no bundler, no `package.json` (it's git-ignored). Don't add one.
- **CSS scoping:** every rule must start with `.tiny-supers.*` — never style bare elements. **Exception:** the dice-roller rules (`.die-roller-content`, `.roll-dice`) intentionally omit the `.tiny-supers` prefix because the dice-roller template is injected into Foundry's Chat Log (via `tiny-supers-chat-controls.mjs`), where there is no `.tiny-supers` ancestor. Those classes are unique to the template, so omitting the prefix is safe. The injected buttons also need `pointer-events: auto` because Foundry v14 sets `pointer-events: none` on the entire `#ui-right` sidebar.
- **Git:** commit messages are hyphen-prefixed changelogs (`- Added ...`). Branch work happens on feature branches, merged to `main`.
- **Debug `console.log`s** are tolerated during development but should be stripped before releases.

## Don't

- Don't add a `package.json`, bundler config, or TypeScript — this project is intentionally plain.
- Don't introduce legacy `Application` (v11-style) code.
- Don't rename the item/actor types without updating all three sync points above.
- Don't move sheet registration out of the `init` hook.
- Don't copy derived values (like `maxStress`) into the Actor schema.
