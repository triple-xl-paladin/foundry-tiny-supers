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

// models/archetype.mjs
//
// This file defines the DATA MODEL for a Tiny Supers Archetype Item.
//
// IMPORTANT FOUNDry VTT v14 CONCEPT:
//
// An Archetype is NOT a new Foundry Document type.
//
// It is an Item with a custom Item type:
//
//     Item
//       │
//       ├── type: "archetype"
//       │
//       └── system
//             ├── archetype
//             ├── archetype_desc
//             ├── stress
//             ├── archetype_trait
//             └── source
//
// The Archetype TypeDataModel defines the structure of that "system" data.
//
// This means Foundry continues to use its normal Item Document, while our
// data model tells Foundry what information a Tiny Supers Archetype contains.


// -----------------------------------------------------------------------------
// FOUNDRY DATA FIELD CLASSES
// -----------------------------------------------------------------------------
//
// These are Foundry's schema field types.
//
// Only NumberField and StringField are currently used by this model.
//
// The others are included because they are available Foundry field types and
// were part of the exploration of the data-model API.
//
// They can be removed if they aren't needed anywhere else in this file.
const {
  HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;

// -----------------------------------------------------------------------------
// ARCHETYPE DATA MODEL
// -----------------------------------------------------------------------------
//
// TypeDataModel describes the custom "system" data belonging to an Item type.
//
// Foundry uses this schema when creating, updating and validating Archetype
// Items.
//
// This is NOT the Item Document itself.
//
// The Item Document still comes from Foundry:
//
//     Item
//
// This class defines:
//
//     Item.system
//
// for Items whose type is "archetype".
export class Archetype extends foundry.abstract.TypeDataModel {
  // ===========================================================================
  // DEFINE THE ARCHETYPE SCHEMA
  // ===========================================================================
  //
  // defineSchema() returns an object describing every field in the Archetype's
  // system data.
  //
  // The keys in this object become the properties available under:
  //
  //     item.system
  //
  // For example:
  //
  //     item.system.archetype
  //
  // and:
  //
  //     item.system.stress
  static defineSchema() {
    return {
      // -----------------------------------------------------------------------
      // ARCHETYPE NAME
      // -----------------------------------------------------------------------
      //
      // Name/title of the Archetype.
      //
      // This is stored separately from the normal Foundry Item "name" field
      // because this is the custom data-model representation used by the
      // importer/template.
      archetype: new StringField(),

      // -----------------------------------------------------------------------
      // ARCHETYPE DESCRIPTION
      // -----------------------------------------------------------------------
      //
      // Descriptive text explaining what the Archetype does.
      //
      // This is currently a StringField. If we eventually want rich text,
      // HTMLField may be more appropriate.
      archetype_desc: new StringField(),

      // -----------------------------------------------------------------------
      // STRESS
      // -----------------------------------------------------------------------
      //
      // Numeric Stress value associated with the Archetype.
      //
      // NumberField tells Foundry this is numeric data rather than text.
      stress: new NumberField(),

      // -----------------------------------------------------------------------
      // ARCHETYPE TRAIT
      // -----------------------------------------------------------------------
      //
      // The trait associated with this Archetype.
      //
      // This is currently stored as text.
      archetype_trait: new StringField(),

      // -----------------------------------------------------------------------
      // SOURCE
      // -----------------------------------------------------------------------
      //
      // Indicates where the Archetype came from.
      //
      // For example, this could contain a book/source reference.
      //
      // It is currently free-form text.
      source: new StringField(),
    };
  }
}
