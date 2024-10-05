// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { EmbedBuilder } = require("discord.js");

function generateBalanceEmbed(client, target, member) {
    if (target.user.bot) return new EmbedBuilder().setDescription("No. Target user is a bot (Lmao!)");

    if (!client.stormworks.players.getSteamIdFromDiscordId(target.user.id)) {
        const embed = new EmbedBuilder();
        embed.setTitle("Not Linked");
        embed.setDescription("Target user cannot use Ash Economy because they have not linked their account to Stormworks.");
        return embed;
    }

    const embed = new EmbedBuilder();
    embed.setColor(target.displayColor);
    embed.setAuthor({ name: target.displayName + "'s Economy Accounts", iconURL: target.user.avatarURL() });

    let combinedBalance = 0;
    const primaryAccount = client.economy.getPrimaryAccount(target.user.id);
    for (const accountId of client.economy.getAccounts(target.user.id)) {
        const account = client.economy.getAccount(accountId);
        if (account.type === client.economy.enums.accountTypes("Faction") && account.ownerId === 0) continue; // system accounts not shown
        embed.addFields({ name: `${accountId === primaryAccount.id ? ":star:" : ""} [ ${accountId} ] ${account.name}`, value: `${account.owner === target.user.id ? "" : `Owner: ${account.formattedOwner}\n`}Balance: ${account.balance.toLocaleString()} ${client.config.economy.moneySymbol}` });
        combinedBalance += account.balance;
    }

    embed.setDescription(`Total: ${combinedBalance.toLocaleString()} ${client.config.economy.moneySymbol}`);
    embed.setFooter({ text: `Ash Economy | Requested by ${member.displayName}` });

    return embed;
}

module.exports = {
    name: "balance",
    description: "View your or someone else's balance.",
    usage: "balance <user>",
    category: "Economy",
    aliases: ["bal", "b", "socialcredits"],
    async execute(client, message, args) {
        if (!client.stormworks.players.getSteamIdFromDiscordId(message.author.id)) {
            const embed = new EmbedBuilder();
            embed.setTitle("Not Linked");
            embed.setDescription(`You must link your account to Stormworks before you can use Ash Economy.\n\nTo link your account, run \`${client.config.prefix}link\`.`);
            return message.channel.send({ embeds: [ embed ] });
        }

        const user = await client.getUser(message, args[0]);
        if (user.user.bot) return message.channel.send("No.");

        message.channel.send({ embeds: [ generateBalanceEmbed(client, user, message.member) ] });
    },
    applicationCommands: [
        {
            name: "balance",
            description: "View your or someone else's balance.",
            type: 1, // Slash command
            options: [
                {
                    name: "user",
                    description: "The person whose balance you want to view.",
                    required: false,
                    type: 6
                }
            ],
            execute: function(client, interaction) {
                interaction.reply({ embeds: [ generateBalanceEmbed(client, interaction.options.get("user") ? interaction.options.get("user").member : interaction.member, interaction.member) ] });
            }
        },
        {
            name: "View Balance",
            type: 2, // User context menu
            execute: function(client, interaction) {
                interaction.reply({ ephemeral: true, embeds: [ generateBalanceEmbed(client, interaction.targetMember, interaction.member) ] });
            }
        }
    ]
}