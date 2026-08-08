const {
  HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;

export class Trait extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      trait: new StringField(),
      trait_desc: new StringField(),
      trait_group: new StringField(),
    };
  }
}
