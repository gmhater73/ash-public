// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * This command is redundant unless you choose to build off of this style verification system (see stormworksLink.js). It is provided for convenience.

const { EmbedBuilder } = require("discord.js");
const nanoid = require("nanoid").customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz");

module.exports = {
    name: "link",
    description: "Links your Discord account to Stormworks. Run this command to view your link code.",
    usage: "link",
    category: "Stormworks",
    async execute(client, message) {
        if (client.stormworks.players.getSteamIdFromDiscordId(message.author.id)) return message.channel.send("You are already linked to Stormworks. If you would like to unlink your account, please contact staff.");

        const key = client.stormworks.tempLinkCodes.find(message.author.id);
        const linkCode = key ? key : nanoid(4);
        client.stormworks.tempLinkCodes.set(linkCode, message.author.id);

        await message.member.createDM();

        const embed = new EmbedBuilder();
        embed.setTitle("Link to Stormworks");
        embed.setDescription("Please follow these directions to link your Discord account to in-game servers.");
        embed.addFields(
            { name: "Link Code", value: `**${linkCode}**\n*Do not share your link code with anyone.*` },
            { name: "Directions", value: `Join the Stormworks server and type \`?link ${linkCode}\` in the **in-game chat.**` },
        );

        try {
            await message.member.send({ embeds: [ embed ] });
        } catch {
            return message.reply("Unable to DM you. Please configure your settings to allow direct messages from this server or contact staff.");
        }

        message.reply("Please check your DMs.");
    }
}