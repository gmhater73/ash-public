<p align="center">
  <img src="https://cdn.discordapp.com/avatars/761358247373438997/6d5668707a08fff7fd4e8324fc5cb9d2.png?size=128" style="border-radius: 100%;" />
</p>

# ash-public

Ash 2: Stormworks RP server management bot

Written in JavaScript

Created by @.fuckme

# Features

- Economy system based on accounts
- Leaderboards
- Group system
- Full entity permissions system
- Nations and factions
- Player data and barebones verification system
- Command handler for prefix and app commands
- GraphQL server
- A performant, consistent, easy-to-use design

## Differences from StormLands Ash

Ash Public omits some features from StormLands Ash.

Notably, it omits:
- Ash Vehicles (Vehicles system)
- AshSSM (Stormworks server manager) (and by extension, linking verification system)
- SWLink (Stormworks server reflection system)

One may reimplement these functions themselves if they so desire to regain features such as verification.

See the comments at the top of each file for more information.

# Getting started

1) Clone this repository to a folder
2) Install Node.js if it is not already installed
3) Run `npm install` to install dependencies
    - Some dependencies such as `better-sqlite3` may require build tools
4) Configure bot administrators and other details in `config.json` (important! Do this before continuing)
5) Run `firstrun.js` to initialize the database
6) Run `index.js` to start Ash

# For more information

For more information, see the comments at the top of each file.

Thank you for using StormLands Ash.

This version of Ash is provided with no warranty, no guarantee, and no support. Please attribute correctly.

<p align="center">
  <img src="https://cdn.discordapp.com/banners/761358247373438997/24e062660c7562a9b4a5e68b5b6cbee2.png?size=1024" />
</p>