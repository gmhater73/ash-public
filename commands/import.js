// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * Use !import if you are importing Ash data in JSON format.

// NEEDS REWRITE

const fs = require("fs");

module.exports = {
    name: "import",
    description: "Imports data to JSON.",
    usage: "import",
    category: "System",
    adminOnly: true,
    async execute(client, message) {
        const msg = await message.channel.send(`${client.config.emojis.loading2} Please create directory in root \`import\` with \`economy.json\` \`economy-accounts.json\` \`factions.json\` \`factions-factions.json\` \`nations.json\` \`nations-nations.json\` \`stormworks-players.json\` files for importing. Waiting for \`ok\` or \`cancel\``);

        const result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id, max: 1, time: 60000, errors: ["time"] })
            .catch(() => msg.edit("Timed out."));
        if (!result.first()) return;
        if (result.first().content.toLowerCase() === "cancel") return msg.edit("Canceled.");

        const files = fs.readdirSync("./import");
        if (files.length === 0) return msg.edit("No files found in \`./import\`.");
        if (files.includes("economy.json")) client.economy.data.import(fs.readFileSync("./import/economy.json"));
        if (files.includes("economy-accounts.json")) client.economy.accounts.import(fs.readFileSync("./import/economy-accounts.json"));
        if (files.includes("factions.json")) client.factions.data.import(fs.readFileSync("./import/factions.json"));
        if (files.includes("factions-factions.json")) client.factions.factions.import(fs.readFileSync("./import/factions-factions.json"));
        if (files.includes("nations.json")) client.nations.data.import(fs.readFileSync("./import/nations.json"));
        if (files.includes("nations-nations.json")) client.nations.nations.import(fs.readFileSync("./import/nations-nations.json"));
        if (files.includes("stormworks-players.json")) client.stormworks.players.import(fs.readFileSync("./import/stormworks-players.json"));

        await msg.edit(":white_check_mark: Data restored. Ash restarting");
        process.exit(0);
    }
}