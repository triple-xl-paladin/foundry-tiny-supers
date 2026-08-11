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
      powerOrigin: new StringField(),
      stress: new NumberField({ initial: 0 }),
      masteredWeapons: new StringField(),
      proficientWeapons: new StringField(),
      powerLevel: new StringField()
    };
  }
}
