const {
  HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;

export class Archetypes extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      archetype: new StringField(),
      archetype_desc: new StringField(),
      stress: new NumberField(),
      archetype_trait: new StringField(),
    };
  }
}
