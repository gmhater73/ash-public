"use strict";

// 10231

console.log("Ash Public\n \nCreated by @.fuckme\n ");

console.log("* RIP StormLands 2022-2024");
console.log("* Please refer to the README.md for information on how this version of Ash differs from the version used in StormLands.");
console.log("* Trouble starting for the first time? Run firstrun.js OR run !import command OR copy previously initialized data.");

const { Client, Collection, ActivityType, Partials, GatewayIntentBits } = require("discord.js");

const client = new Client({
    partials: [ Partials.Channel ],
    intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages ],
    presence: { activities: [ { type: ActivityType.Watching, name: "Please wait" } ] }//type: "WATCHING", name: `for ${require("./config.json").prefix}help` } ] }
});
client.config = require("./config.json");
client.rootPath = __dirname;

process.client = client;

client.log = (statusColor, status, text, textColor) => console[status.includes("ERROR") ? "error" : "log"](`[${require("moment")().format("M/D/YY HH:mm:ss:SSS")}]: ${require("chalk")[statusColor].bold(`[${status}]`)}: ${textColor ? require("chalk")[textColor](text) : text}`);

process.on("unhandledRejection", error => { client.log("bgRed", "UNHANDLED REJECTION", error.stack); });
process.on("uncaughtException", error => { client.log("bgRed", "UNCAUGHT EXCEPTION", error.stack); process.exit(1); });

client.commands = new Collection();
for (const file of require("fs").readdirSync("./commands").filter(file => file.endsWith(".js"))) {
    client.log("bgGreen", "BOOT", `Loading command ${file}.`);
    const commandData = require(`./commands/${file}`);
    client.commands.set(commandData.name, commandData);
}
client.applicationCommands = Array.from(client.commands.values()).filter(command => command.applicationCommands).flatMap(command => command.applicationCommands);

client.login(client.config.credentials.token); client.config.credentials.token = undefined;

for (const file of require("fs").readdirSync("./modules").filter(file => file.endsWith(".js"))) {
    client.log("bgGreen", "BOOT", `Starting module ${file}.`);
    require(`./modules/${file}`).main(client);
}

for (const dir of require("fs").readdirSync("./modules", { withFileTypes: true }).filter(file => file.isDirectory())) {
    client.log("bgGreen", "BOOT", `Starting module ${dir.name}/index.js.`);
    require(`./modules/${dir.name}/index.js`).main(client);
}

client.on("ready", () => client.log("bgGreen", "BOOT", `Connected as ${client.user.username} in ${client.guilds.cache.size} guilds.\u0007`, "green"));

/*client.on("ready", () => {
    for (const file of require("fs").readdirSync("./modules").filter(file => file.endsWith(".js"))) {
        const module = require(`./modules/${file}`);
        if (module.mainClientReady) { client.log("bgGreen", "BOOT", `Ready module ${file}.`); module.mainClientReady(client); }
    }
});*/

//client.on("debug", str => client.log("bgGray", "DEBUG", `[discord.js]: ${str}`));

require("./web/index.js");

client.log("bgGreen", "BOOT", "Started.", "green");