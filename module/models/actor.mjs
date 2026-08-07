const {
  HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;

export class SuperHero extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      civilianIdentity: new StringField(),
      appearance: new StringField(),
      beliefs: new StringField(),
      weakness: new StringField(),
      archetype: new StringField(),
      powerOrigin: new StringField(),
      stress: new StringField(),
      trait1: new StringField(),
      trait2: new StringField(),
      trait3: new StringField(),
      masteredWeapons: new StringField(),
      proficientWeapons: new StringField(),
      powerLevel: new StringField()
    };
  }
}
