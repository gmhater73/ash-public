// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * Do not use the git flag if you have not set up git on your system and in Ash's working directory.

const { ActivityType } = require("discord.js");

module.exports = {
    name: "reboot",
    description: "Attempts to restart the bot. Use [git] flag to run git pull.",
    usage: "reboot [git]",
    aliases: ["restart"],
    category: "System",
    adminOnly: true,
    async execute(client, message, args) {
        if (args[0] === "git") {
            const msg = await message.channel.send(`${client.config.emojis.loading} Git pull`);
            await msg.edit(`Git pull:\n\`\`\`js\n${await client.gitPull()}\`\`\``);
        }
        await message.channel.send("Rebooting");
        await client.user.setPresence({ activities: [ { type: ActivityType.Watching, name: "myself reboot" } ] });
        process.exit(0);
    }
}