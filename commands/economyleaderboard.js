// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * This command is deprecated and hidden from !help. See leaderboard.js instead

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

function generateLeaderboardEmbed(client, member, page) {
    const embed = new EmbedBuilder();
    embed.setColor(member.displayColor);
    embed.setTitle("Leaderboard");

    const accounts = [];
    let combinedMoney = 0;
    for (const [id, account] of client.economy.accounts) {
        if (account.type === client.economy.enums.accountTypes("Faction") && account.ownerId === 0) continue;
        combinedMoney += account.balance;
        accounts.push([account.name.includes("'s Personal Account") && account.users ? `<@${account.users[0]}>` : `\`#${id}\` ${account.name}`, account.balance, id]);
    }

    const top = accounts.sort((a, b) => b[1] - a[1]);

    let description = `${accounts.length} total accounts with ${combinedMoney.toLocaleString()} ${client.config.economy.moneySymbol} combined\n${client.economy.data.has("primaryAccounts", member.id) ? `Your rank is #${top.findIndex(account => account[2] == client.economy.data.get("primaryAccounts", member.id)) + 1}\n` : "\n"}`;
    let i = page * 10 + 1;
    for (const account of top.splice(page * 10, 10)) description += `\n**${i++})** ${account[0]} • ${account[1].toLocaleString()} ${client.config.economy.moneySymbol}`;

    embed.setDescription(description);

    embed.setFooter({ text: `Ash Economy | Requested by ${member.displayName}` });

    return embed;
}

module.exports = {
    name: "economyleaderboard",
    description: "Lists richest accounts in StormLands.\n**This command is deprecated, please use** `/leaderboard`",
    usage: "economyleaderboard <page>",
    aliases: ["leaderboard", "lb", "leader", "baltop", "richest"],
    execute(client, message, args) {
        let page = args[0] ? Number(args[0]) - 1 : 0;
        if (isNaN(page) || page < 0) page = 0;
        if (page > Math.floor(client.economy.accounts.size / 10)) page = Math.floor(client.economy.accounts.size / 10);

        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%economyleaderboard, ${page - 1}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Prev")
                .setEmoji("◀️")
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%economyleaderboard, ${page + 1}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Next")
                .setEmoji("▶️")
                .setDisabled(page === Math.floor(client.economy.accounts.size / 10))
        );

        message.channel.send({ embeds: [ generateLeaderboardEmbed(client, message.member, page) ], components: [ actionRow ] });
    },
    interaction(client, interaction) {
        const page = Number(interaction.customTags[0]);

        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${interaction.user.id}%economyleaderboard, ${page - 1}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Prev")
                .setEmoji("◀️")
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`${interaction.user.id}%economyleaderboard, ${page + 1}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Next")
                .setEmoji("▶️")
                .setDisabled(page === Math.floor(client.economy.accounts.size / 10))
        );

        interaction.update({ embeds: [ generateLeaderboardEmbed(client, interaction.member, page) ], components: [ actionRow ] });
    }
}