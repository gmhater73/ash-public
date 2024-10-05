// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "swunban",
    description: "Unbans a user from in-game servers. This command only removes bans that are associated with the user's Discord ID and link data.",
    usage: "swunban [user]",
    aliases: ["unban"],
    category: "Moderation",
    supportOnly: true,
    argsRequired: true,
    async execute(client, message, args) {
        const user = await client.getTargetUser(message, args.shift());
        if (!user) return message.channel.send(`Command error; run \`${client.config.prefix}help swban\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 0, "Target user was not found")}`);
        if (user.user.bot) return message.channel.send(`Command error; run \`${client.config.prefix}help swban\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 0, "Target user is a bot (LOL!)")}`);

        const existingBan = client.stormworks.players.getBan(user.id);
        if (!existingBan) return message.channel.send("User is not banned.");

        client.stormworks.players.delete(user.id, "ban");

        const embed = new EmbedBuilder();
        embed.setColor(client.config.colors.green);
        embed.setTitle("User Unbanned");
        embed.setDescription(`User <@${user.id}> has been unbanned from in-game servers.\n\n**Details:**\nUntil: <t:${Math.floor(existingBan.until / 1000)}>\nReason: ${existingBan.reason}`);
        embed.setFooter({ text: `SWLink | Requested by ${message.member.displayName}` });

        message.channel.send({ embeds: [embed] });
    }
}