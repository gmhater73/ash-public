// Ash Public
// @.fuckme
// * The first run script sets Ash up in a manner similar to how it was used on StormLands - creating a system faction, initializing pool to 1,000,000, and then setting up fee accounts.
// * If you choose not to run this script:
// * * At minimum, a #0 account (Pool account) must be available for Ash to run with no errors.
// * * Recommend also creating accounts for nation and faction registration fees and then editing createnation.js and createfaction.js so that nation and faction creation is possible.

"use strict";

console.log("Ash Public\n \nCreated by @.fuckme\n ");

console.log("* First run script: please wait.\n ");

const { EventEmitter } = require("node:events");

const client = new EventEmitter();
client.config = require("./config.json");
client.rootPath = __dirname;

process.client = client;

client.log = (statusColor, status, text, textColor) => console[status.includes("ERROR") ? "error" : "log"](`[${require("moment")().format("M/D/YY HH:mm:ss:SSS")}]: ${require("chalk")[statusColor].bold(`[${status}]`)}: ${textColor ? require("chalk")[textColor](text) : text}`);

process.on("unhandledRejection", error => { client.log("bgRed", "UNHANDLED REJECTION", error.stack); });
process.on("uncaughtException", error => { client.log("bgRed", "UNCAUGHT EXCEPTION", error.stack); process.exit(1); });

console.log("* 1) Preparing Ash");

for (const file of require("fs").readdirSync("./modules").filter(file => file.endsWith(".js")).filter(file => file.includes("Manager"))) {
    client.log("bgGreen", "BOOT", `Starting module ${file}.`);
    require(`./modules/${file}`).main(client);
}

console.log("* 2) Create System faction");

const faction = client.factions.createFaction("System", 0);
faction.description = "Ash System Faction";
faction.shortDescription = "Ash System Faction";
faction.color = "#000000";
faction.addMember(client.config.staff.admins[0]).rankId = "4";
faction.ownerId = client.config.staff.admins[0];

console.log("* 3) Create #0 Pool account");
const pool = client.economy.createAccount("Pool", 0, 1, 0, true);
pool.ownerId = 0;
pool.balance = 1_000_000;

console.log("* 4) Create #1 Nation registration fee account");
client.economy.createAccount("Nation Registration Fees", 0, 1).ownerId = 0;

console.log("* 5) Create #2 Faction registration fee account");
client.economy.createAccount("Faction Registration Fees", 0, 1).ownerId = 0;

client.log("bgGreen", "BOOT", "OK", "green");

console.log("* Finish first run.");