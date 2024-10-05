// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "unlink",
    description: "Deletes a user's link data and unverifies them by removing their Steam ID from the database.\nThe user will lose workbench authorization and access to most Ash features.",
    usage: "unlink [user] [f]",
    category: "Stormworks",
    supportOnly: true,
    argsRequired: true,
    async execute(client, message, args) {
        let user = await client.getTargetUser(message, args[0]);
        //if (!user) return message.channel.send(`Command error; run \`${client.config.prefix}help unlink\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 0, "Target user was not found")}`);
        if (!user) user = { id: args[0] };
        if (!client.stormworks.players.getSteamIdFromDiscordId(user.id)) return message.channel.send(`Command error; run \`${client.config.prefix}help unlink\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 0, "No data for target user")}`);

        const steamId = client.stormworks.players.getSteamIdFromDiscordId(user.id);

        const ban = client.stormworks.players.getBan(user.id);

        const embed = new EmbedBuilder();
        embed.setColor(client.config.colors.red);
        embed.setTitle("Unlink User");
        embed.setDescription(`Are you sure you would like to unlink <@${user.id}>'s Steam account [${steamId}](https://steamcommunity.com/profiles/${steamId})?\n\nThey will lose workbench authorization and access to most Ash features.${ban ? `\n:warning: **This user has a ban that expires on <t:${Math.floor(ban.until / 1000)}>.** Unlinking will disable the ban.` : ""}`);
        embed.setFooter({ text: `SWLink | Requested by ${message.member.displayName}` });

        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%unlink, confirm, ${user.id}`)
                .setStyle(ButtonStyle.Danger)
                .setLabel("Yes"),
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%unlink, cancel`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("No")
        );

        message.channel.send({ embeds: [embed], components: [actionRow] });
    },
    async interaction(client, interaction) {
        if (interaction.customTags[0] === "confirm") {
            const userId = interaction.customTags[1];

            if (!client.stormworks.players.getSteamIdFromDiscordId(userId)) return interaction.reply({ content: "No data for target user", ephemeral: true });

            const steamId = client.stormworks.players.getSteamIdFromDiscordId(userId);
            client.stormworks.players.delete(userId, "steamId");

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setTitle("User Unlinked");
            embed.setDescription(`<@${userId}>'s Steam account [${steamId}](https://steamcommunity.com/profiles/${steamId}) has been unlinked.`);
            embed.setFooter({ text: `SWLink | Requested by ${interaction.member.displayName}` });
            interaction.message.edit({ embeds: [embed], components: [] });
        } else if (interaction.customTags[0] === "cancel") {
            const embed = new EmbedBuilder();
            embed.setDescription("Canceled.");
            embed.setFooter({ text: `SWLink | Requested by ${interaction.member.displayName}` });
            interaction.message.edit({ embeds: [embed], components: [] });
        }
    }
}