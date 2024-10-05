// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * This command is deprecated and hidden from !help. See leaderboard.js instead

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const moment = require("moment"); require("moment-duration-format");

function generateLeaderboardEmbed(client, member, page) {
    const embed = new EmbedBuilder();
    embed.setColor(member.displayColor);
    embed.setTitle("Playtime Leaderboard");

    const users = [];
    let combinedTime = 0;
    let combinedTimesJoined = 0;
    let combinedTimesDied = 0;
    for (const [id, data] of client.stormworks.players) {
        combinedTime += data.playTime;
        combinedTimesJoined += data.timesJoined;
        combinedTimesDied += data.timesDied;
        users.push([id, data.playTime]);
    }

    const top = users.sort((a, b) => b[1] - a[1]);

    let description = `${users.length.toLocaleString()} verified users\n${moment.duration(combinedTime).format("D [days], H [hrs], m [mins]", true)} total playtime\n${combinedTimesJoined.toLocaleString()} total times joined\n${combinedTimesDied.toLocaleString()} total deaths\nYour rank is #${top.findIndex(user => user[0] === member.id) + 1}\n`;
    let i = page * 10 + 1;
    for (const user of top.splice(page * 10, 10)) description += `\n**${i++})** <@${user[0]}> • ${moment.duration(user[1]).format("H [hrs], m [mins], s [secs]", true)}`;

    embed.setDescription(description);

    embed.setFooter({ text: `SWLink | Requested by ${member.displayName}` });

    return embed;
}

module.exports = {
    name: "playtimeleaderboard",
    description: "Lists users with most playtime on StormLands.\n**This command is deprecated, please use** `/leaderboard`",
    usage: "playtimeleaderboard <page>",
    aliases: ["pttop", "toppt", "ptlb", "plb"],
    execute(client, message, args) {
        let page = args[0] ? Number(args[0]) - 1 : 0;
        if (isNaN(page) || page < 0) page = 0;
        if (page > Math.floor(client.stormworks.players.size / 10)) page = Math.floor(client.stormworks.players.size / 10);

        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%playtimeleaderboard, ${page - 1}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Prev")
                .setEmoji("◀️")
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%playtimeleaderboard, ${page + 1}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Next")
                .setEmoji("▶️")
                .setDisabled(page === Math.floor(client.stormworks.players.size / 10))
        );

        message.channel.send({ embeds: [ generateLeaderboardEmbed(client, message.member, page) ], components: [ actionRow ] });
    },
    interaction(client, interaction) {
        const page = Number(interaction.customTags[0]);

        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${interaction.user.id}%playtimeleaderboard, ${page - 1}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Prev")
                .setEmoji("◀️")
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`${interaction.user.id}%playtimeleaderboard, ${page + 1}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Next")
                .setEmoji("▶️")
                .setDisabled(page === Math.floor(client.stormworks.players.size / 10))
        );

        interaction.update({ embeds: [ generateLeaderboardEmbed(client, interaction.member, page) ], components: [ actionRow ] });
    }
}