# Tiny Supers Foundry VTT System

A Foundry Virtual Tabletop system implementation for **Tiny Supers**, built on the Tiny D6 game engine.

This project aims to provide a modern Foundry VTT experience for playing Tiny Supers, including character sheets, actor management, traits, powers, and other system features.

## Compatibility

Designed for Foundry Virtual Tabletop v14 using the ApplicationV2 API architecture.

## Features

- Foundry VTT ApplicationV2 support
- Modern Foundry VTT v13/v14 compatible architecture
- Custom character sheets built using ApplicationV2
- Trait and power management
- Tiny D6 style character handling
- Support for superhero character creation
- Designed for easy extension to other Tiny D6 games in the future

## Project Status

This project is currently under active development.

The goal is to provide a clean, maintainable implementation compatible with current versions of Foundry VTT.

## Installation

Manifest URL: `https://raw.githubusercontent.com/triple-xl-paladin/foundry-tiny-supers/main/system.json`

The system should now show up in your Foundry VTT and can be used to create a new world.

### Manual Installation

1. Download or clone this repository.
2. Copy the project folder into your Foundry VTT `Data/systems` directory.
3. Enable the system from the Foundry VTT setup screen.

## Development

This project uses modern Foundry VTT development practices, including:

- ES modules (`.mjs`)
- Foundry VTT ApplicationV2 framework
- Modern document and application APIs
- Handlebars templates for UI rendering

## AI Assistance
This project was developed with extensive assistance from AI tools, which were used for code generation, debugging, documentation, explanation, and learning. All generated code was reviewed, tested, modified, and integrated by the project author.

### Requirements

- Foundry VTT
- A modern web browser
- Basic JavaScript knowledge

The project is written using modern JavaScript modules (`.mjs`) and Foundry VTT's current API approach.

## JSON Import Format

The system's **Import JSON** menu (available under the Tiny Supers settings, GM-only) accepts a JSON file containing exactly **one** root collection. The root key selects what is imported:

- `traits` — an array of Trait items
- `archetypes` — an array of Archetype items
- `actors` — an array of pregen Hero actors

Imported documents are placed into world Compendiums (`Tiny Supers - Traits`, `Tiny Supers - Archetypes`, `Tiny Supers - Pregens`). Importing the same file again **updates** existing documents (matched by name + type) rather than creating duplicates.

### Example: traits

```json
{
  "traits": [
    {
      "trait": "Flight",
      "trait_desc": "The hero can fly.",
      "trait_group": "power"
    }
  ]
}
```

### Example: archetypes

```json
{
  "archetypes": [
    {
      "archetype": "The Avenger",
      "archetype_desc": "A hero who fights for justice.",
      "stress": 6,
      "archetype_trait": "Brave",
      "source": "Tiny Supers p.12"
    }
  ]
}
```

### Example: actors (pregens)

```json
{
  "actors": [
    {
      "name": "Captain Cosmos",
      "civilianIdentity": "Joe Citizen",
      "appearance": "Tall, blue suit.",
      "beliefs": "Protect the innocent.",
      "weakness": "Kryptonite.",
      "archetype": "The Avenger",
      "powerOrigin": "Alien",
      "stress": 0,
      "masteredWeapons": "Heat vision",
      "proficientWeapons": "Flying fist",
      "powerLevel": "Cosmic"
    }
  ]
}
```

> **Note:** pregen actors do not include trait items in the import format. Traits are embedded Item documents on the character sheet; add them by dragging Trait items onto the sheet after importing.

## Contributing

Contributions, bug reports, and suggestions are welcome.

If you would like to contribute:

1. Fork this repository.
2. Create a feature branch.
3. Make your changes.
4. Submit a pull request.

Please ensure that contributions remain compatible with the GPL-3.0 license.

## License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

You are free to:

- Use this software.
- Modify this software.
- Share this software.
- Distribute modified versions.

Any distributed modified versions must also be released under the GPL-3.0 license and provide access to the source code.

See the `LICENSE` file for the full license text.

## Important Notice Regarding Game Content

This project is an implementation for use with the Tiny Supers roleplaying game.

The Tiny Supers game rules, text, artwork, trademarks, and other original game content remain the property of their respective owners.

This repository contains software code only unless otherwise stated.

Users should obtain the appropriate Tiny Supers rulebook or authorised game materials to play.

## Acknowledgements

- The Foundry VTT community for documentation and examples.
- The Tiny D6 community for inspiration and support.
- All contributors who help improve this project.

---

**Tiny Supers Foundry VTT System**  
Licensed under GPL-3.0