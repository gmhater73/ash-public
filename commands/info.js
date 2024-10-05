// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { EmbedBuilder } = require("discord.js");
const moment = require("moment"); require("moment-duration-format");

function generateInfoEmbed(client, target, member) {
    if (!client.stormworks.players.getSteamIdFromDiscordId(target.user.id)) {
        const embed = new EmbedBuilder();
        embed.setTitle("No data");
        embed.setDescription(`No data available for <@${target.user.id}>.`);
        return embed;
    }

    const data = client.stormworks.players.getDataFromDiscordId(target.user.id);

    const embed = new EmbedBuilder();
    embed.setColor(target.displayColor);
    embed.setAuthor({ name: `${target.displayName} Information`, iconURL: target.user.avatarURL() });
    embed.setDescription(`Information for <@${target.user.id}>\nVerified on <t:${Math.floor(data.verifiedTimestamp / 1000)}> <t:${Math.floor(data.verifiedTimestamp / 1000)}:R>`);
    const ban = client.stormworks.players.getBan(target.user.id);
    if (ban) embed.addFields({
        name: ":warning: Ban",
        value: `**Banned until <t:${Math.floor(ban.until / 1000)}>**\nReason: ${ban.reason}`
    });

    /*const isBlacklisted = client.ssm.hasBlacklist(data.steamId);
    if (isBlacklisted) embed.addFields({
        name: ":warning: Blacklisted",
        value: `**The Steam ID associated with this player is blacklisted from servers.**`
    });*/

    embed.addFields(
        { name: "Steam Profile", value: `https://steamcommunity.com/profiles/${data.steamId}` },
        { name: "Playtime", value: moment.duration(data.playTime).format("H [hrs], m [mins], s [secs]", true), inline: true },
        { name: "Times Joined", value: data.timesJoined.toLocaleString(), inline: true },
        { name: "Deaths", value: data.timesDied.toLocaleString(), inline: true },
        { name: "Last Played", value: `<t:${Math.floor(data.lastPlayed / 1000)}> <t:${Math.floor(data.lastPlayed / 1000)}:R>`, inline: true },
    );

    const accounts = client.economy.getAccounts(target.user.id);
    if (accounts.length > 0) {
        let economyText = "";
        let combinedBalance = 0;
        const primaryAccount = client.economy.getPrimaryAccount(target.user.id);
        for (const accountId of accounts) {
            if (accountId === 0) continue;
            const account = client.economy.getAccount(accountId);
            combinedBalance += account.balance;
            economyText += `${accountId === primaryAccount.id ? ":star: " : ""}\`#${account.id}\` \`${account.name}\` \`${account.balance.toLocaleString()} ${client.config.economy.moneySymbol}\`\n`;
        }
        embed.addFields({ name: `Economy (${combinedBalance.toLocaleString()} ${client.config.economy.moneySymbol})`, value: economyText });
    }

    const nations = client.nations.getNations(target.user.id);
    if (nations.length > 0) {
        let nationsText = "";
        for (const nationId of nations) {
            const nation = client.nations.getNation(nationId);
            nationsText += `\`${nation.name}\` - \`${nation.getMember(target.user.id).rank.name}\`\n`;
        }
        embed.addFields({ name: "Nations", value: nationsText });
    }

    const factions = client.factions.getFactions(target.user.id);
    if (factions.length > 0) {
        let factionsText = "";
        for (const factionId of factions) {
            const faction = client.factions.getFaction(factionId);
            factionsText += `\`${faction.name}\` - \`${faction.getMember(target.user.id).rank.name}\`\n`;
        }
        embed.addFields({ name: "Factions", value: factionsText });
    }

    embed.setFooter({ text: `Ash | Requested by ${member.displayName}` });

    return embed;
}

module.exports = {
    name: "info",
    description: "View info about a person.",
    usage: "info <user>",
    category: "Stormworks",
    aliases: ["playerinfo"],
    async execute(client, message, args) {
        message.channel.send({ embeds: [ generateInfoEmbed(client, await client.getUser(message, args[0]), message.member) ] });
    },
    applicationCommands: [
        {
            name: "info",
            description: "View info about yourself or a person.",
            type: 1, // Slash command
            options: [
                {
                    name: "user",
                    description: "The person whose information you want to view.",
                    required: false,
                    type: 6
                }
            ],
            execute: function(client, interaction) {
                interaction.reply({ embeds: [ generateInfoEmbed(client, interaction.options.get("user") ? interaction.options.get("user").member : interaction.member, interaction.member) ] });
            }
        },
        {
            name: "View Player Info",
            type: 2, // User context menu
            execute: function(client, interaction) {
                interaction.reply({ ephemeral: true, embeds: [ generateInfoEmbed(client, interaction.targetMember, interaction.member) ] });
            }
        }
    ]
}