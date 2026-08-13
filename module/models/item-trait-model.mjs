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

// models/trait.mjs
//
// This file defines the DATA MODEL for a Tiny Supers Trait Item.
//
// As with Archetypes, a Trait is NOT a separate Foundry Document class.
//
// It is an Item with the custom Item type:
//
//     type: "trait"
//
// The relationship is:
//
//     Foundry Item
//          │
//          ├── type: "trait"
//          │
//          └── system
//                ├── trait
//                ├── trait_desc
//                └── trait_group
//
// This TypeDataModel defines the structure of that system data.


// -----------------------------------------------------------------------------
// FOUNDRY DATA FIELD CLASSES
// -----------------------------------------------------------------------------
//
// Foundry provides these classes for describing the fields in a data model.
//
// This model only currently needs StringField.
//
// The other imported field classes were explored while learning Foundry's
// data-model API and may be useful later.
//
// If they aren't used elsewhere in this file, they can eventually be removed
// from this import.
const {
  HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;

// -----------------------------------------------------------------------------
// TRAIT DATA MODEL
// -----------------------------------------------------------------------------
//
// This class defines the custom data stored under:
//
//     item.system
//
// for Tiny Supers Items whose type is "trait".
//
// Again, this is the DATA MODEL, not the Item itself.
//
// Foundry still creates and manages the Item Document.
export class Trait extends foundry.abstract.TypeDataModel {

  // ===========================================================================
  // DEFINE THE TRAIT SCHEMA
  // ===========================================================================
  //
  // The object returned here defines the fields available under:
  //
  //     item.system
  //
  // Foundry uses this schema to know what type of data each field contains
  // and to validate/manage the Item's system data.
  static defineSchema() {
    return {
      // -----------------------------------------------------------------------
      // TRAIT NAME
      // -----------------------------------------------------------------------
      //
      // The name of the Trait.
      //
      // This is stored as custom system data.
      trait: new StringField(),

      // -----------------------------------------------------------------------
      // TRAIT DESCRIPTION
      // -----------------------------------------------------------------------
      //
      // The description/explanation of the Trait.
      //
      // This is currently plain text.
      //
      // If we later decide that Traits need rich text formatting, this could
      // potentially become an HTMLField instead.
      trait_desc: new StringField(),

      // -----------------------------------------------------------------------
      // TRAIT GROUP
      // -----------------------------------------------------------------------
      //
      // Identifies which group the Trait belongs to.
      //
      // In Tiny Supers this is being used to distinguish the different types
      // of Traits/powers.
      //
      // It is currently stored as free-form text rather than an enumeration,
      // which keeps the model flexible.
      trait_group: new StringField(),
    };
  }
}
