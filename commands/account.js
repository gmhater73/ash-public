// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const fuzzysort = require("fuzzysort");

function generateAccountEmbed(client, account, member) {
    const primaryAccount = account.type === client.economy.enums.accountTypes("Personal") ? client.economy.data.get("primaryAccounts", account.owner) : undefined;

    const embed = new EmbedBuilder();
    embed.setColor(member.displayColor);
    embed.setTitle(`${account.id === primaryAccount ? "⭐" : ""} ${account.name}`);
    embed.setDescription(`Account #${account.id}\n${client.economy.enums.accountTypes.from(account.type)} account${account.id === primaryAccount ? "\nPrimary account" : ""}`);
    embed.addFields(
        { name: "Balance", value: `${account.balance.toLocaleString()} ${client.config.economy.moneySymbol}`, inline: true },
        { name: "Owner", value: account.formattedOwner, inline: true }
    );

    const now = new Date();
    if (account.history.length > 0 && account.hasPermission(member.user.id, client.economy.enums.permissions("UseAccount"))) {
        let history = "";
        for (const data of account.history.slice(0, 10)) {
            const timeDate = new Date(data.time * 1000);
            history += `<t:${data.time}:${now.getFullYear() == timeDate.getFullYear() && now.getMonth() == timeDate.getMonth() && now.getDate() == timeDate.getDate() ? "t" : "d"}> ${data.data}\n`;
        }
        embed.addFields({ name: "History", value: history });
    }

    if (account.type !== client.economy.enums.accountTypes("Personal")) { // "Administrators": users with special permission (delete or rename)
        let administrators = "";
        for (const user of account.getUsersWithPermission(client.economy.enums.permissions("DeleteAccount"), client.economy.enums.permissions("RenameAccount"))) administrators += `<@${user}>, `;
        embed.addFields({ name: "Administrators", value: administrators.slice(0, -2) });
    }

    const accountUsers = account.getUsersWithPermission(client.economy.enums.permissions("UseAccount"));
    if (account.type === client.economy.enums.accountTypes("Personal")) accountUsers.splice(accountUsers.indexOf(account.owner), 1);
    if (accountUsers.length > 0) {
        let users = "";
        for (const user of accountUsers) users += `<@${user}>, `;
        embed.addFields({ name: "Users", value: users.slice(0, -2) });
    }
    
    embed.setFooter({ text: `Ash Economy | Requested by ${member.displayName}` });

    const actionRow = new ActionRowBuilder();
    if (account.type === client.economy.enums.accountTypes("Faction")) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${member.user.id}%faction, selectFaction, ${account.ownerId}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("View Faction")
                .setEmoji("🏛️")
        );
    } else if (account.type === client.economy.enums.accountTypes("Nation")) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${member.user.id}%nation, selectNation, ${account.ownerId}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("View Nation")
                .setEmoji("🌎")
        );
    } else if (account.type === client.economy.enums.accountTypes("Personal") && account.owner === member.user.id) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${member.user.id}%account, addPersonalAccountUser, ${account.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Add User")
                .setEmoji("📥"),
            new ButtonBuilder()
                .setCustomId(`${member.user.id}%account, removePersonalAccountUser, ${account.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Remove User")
                .setEmoji("🚷")
                .setDisabled(account.getUsersWithPermission(client.economy.enums.permissions("UseAccount")).length <= 0)
        );
    }
    if (account.hasPermission(member.user.id, client.economy.enums.permissions("RenameAccount"))) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${member.user.id}%account, renameAccount, ${account.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Rename")
                .setEmoji("📝")
        );
    }
    if (account.hasPermission(member.user.id, client.economy.enums.permissions("DeleteAccount")) && account.id !== primaryAccount) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${member.user.id}%account, promptDeleteAccount, ${account.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Delete")
                .setEmoji("🗑️")
        );
    }

    return [embed, actionRow.components.length > 0 ? [ actionRow ] : undefined];
}

module.exports = {
    name: "account",
    description: "View details about an economy account.",
    usage: "account <OPTIONAL account id>", // pass * or p or personal to quickly view personal account
    category: "Economy",
    aliases: ["ma", "a"],
    async execute(client, message, args) {
        if (!client.stormworks.players.getSteamIdFromDiscordId(message.author.id)) {
            const embed = new EmbedBuilder();
            embed.setTitle("Not Linked");
            embed.setDescription(`You must link your account to Stormworks before you can use Ash Economy.\n\nTo link your account, run \`${client.config.prefix}link\`.`);
            return message.channel.send({ embeds: [ embed ] });
        }

        if (args[0]) {
            const account = (args[0].toLowerCase() === "p" || args[0] === "*" || args[0] === "." || args[0].toLowerCase() === "personal") ? client.economy.getPrimaryAccount(message.author.id) : client.economy.getAccount(args[0]);
            if (!account) return message.channel.send("Account was not found.");

            const [embed, components] = generateAccountEmbed(client, account, message.member);

            message.channel.send({ embeds: [ embed ], components });
        } else {
            const actionRow = new ActionRowBuilder();
            const selectMenu = new SelectMenuBuilder();
            selectMenu.setCustomId(`${message.author.id}%account, selectAccount`);
            selectMenu.setPlaceholder("No account selected");

            const primaryAccount = client.economy.getPrimaryAccount(message.author.id);
            for (const account of client.economy.getAccounts(message.author.id).map(id => client.economy.getAccount(id))) {
                selectMenu.addOptions({
                    label: `[ ${account.id} ] ${account.name}`,
                    description: `${client.economy.enums.accountTypes.from(account.type)}${account.type === client.economy.enums.accountTypes("Personal") ? "" : ` - ${account.owner.name}`} - ${account.balance.toLocaleString()} ${client.config.economy.moneySymbol}`,
                    value: account.id.toString(),
                    emoji: account.id === primaryAccount.id ? "⭐" : (account.type === client.economy.enums.accountTypes("Nation") ? account.owner.emoji  : undefined)
                });
            }

            actionRow.addComponents(selectMenu);
            message.channel.send({ content: "Select an account to view.", components: [ actionRow ] });
        }
    },
    async interaction(client, interaction) {
        if (interaction.customTags[0] === "selectAccount") {
            const account = client.economy.getAccount(interaction.values[0]);
            if (!account) return interaction.reply({ content: `Selected account #${interaction.values[0]} no longer exists.`, ephemeral: true });

            const [embed, components] = generateAccountEmbed(client, account, interaction.member);

            interaction.reply({ embeds: [ embed ], components });
        } else if (interaction.customTags[0] === "addPersonalAccountUser") {
            const account = client.economy.getAccount(interaction.customTags[1]);
            if (!account) return interaction.reply({ content: `Selected account #${interaction.customTags[1]} no longer exists.`, ephemeral: true });
            if (account.type !== client.economy.enums.accountTypes("Personal")) return interaction.reply({ content: `Selected account #${account.id} is not of type Personal.`, ephemeral: true });
            if (interaction.user.id !== account.owner) return interaction.reply({ content: `You do not have permission to manage users on selected account #${account.id}.`, ephemeral: true });

            await interaction.update({ components: [] });
            await interaction.followUp(`Please mention or provide the IDs of the users that you would like to add to account #${account.id}.\n\nType \`cancel\` to cancel.`);

            const result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id, max: 1, time: 300000, errors: ["time"] })
                .catch(() => interaction.editReply(":x: Adding users timed out."));
            if (!result.first()) return;

            if (result.first().content.toLowerCase() === "cancel") return result.first().reply("Adding users canceled.");

            const users = (await client.getUsers(result.first(), result.first().content)).map(user => user.id).filter(userId => client.stormworks.players.getSteamIdFromDiscordId(userId));
            if (users.length < 1) return result.first().reply("No valid users were provided.");

            let addedUsers = "";
            for (const userId of users) {
                account.addUser(userId);
                addedUsers += `<@${userId}>, `;
            }

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.green);
            embed.setTitle("Added Users");
            embed.setDescription(`The following users have been added to account #${account.id}: ${account.name}:\n\n${addedUsers.slice(0, -2)}`);
            embed.setFooter({ text: `Ash Economy | Requested by ${interaction.member.displayName}` });

            result.first().reply({ embeds: [ embed ] });
        } else if (interaction.customTags[0] === "removePersonalAccountUser") {
            const account = client.economy.getAccount(interaction.customTags[1]);
            if (!account) return interaction.reply({ content: `Selected account #${interaction.customTags[1]} no longer exists.`, ephemeral: true });
            if (account.type !== client.economy.enums.accountTypes("Personal")) return interaction.reply({ content: `Selected account #${account.id} is not of type Personal.`, ephemeral: true });
            if (interaction.user.id !== account.owner) return interaction.reply({ content: `You do not have permission to manage users on selected account #${account.id}.`, ephemeral: true });
            if (account.getUsersWithPermission(client.economy.enums.permissions("UseAccount")).length <= 0) return interaction.reply({ content: `Selected account #${account.id} has no users with access.`, ephemeral: true });

            await interaction.update({ components: [] });
            await interaction.followUp(`Please mention or provide the IDs of the users that you would like to remove from account #${account.id}.\n\nType \`cancel\` to cancel.`);

            const result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id, max: 1, time: 300000, errors: ["time"] })
                .catch(() => interaction.editReply(":x: User removal timed out."));
            if (!result.first()) return;

            if (result.first().content.toLowerCase() === "cancel") return result.first().reply("User removal canceled.");

            const users = (await client.getUsers(result.first(), result.first().content)).map(user => user.id).filter(user => account.hasPermission(user, client.economy.enums.permissions("UseAccount")));
            if (users.length < 1) return result.first().reply("No valid users were provided.");

            let removedUsers = "";
            for (const userId of users) {
                if (account.hasPermission(userId, client.economy.enums.permissions("UseAccount"))) {
                    account.removeUser(userId);
                    removedUsers += `<@${userId}>, `;
                }
            }

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setTitle("Removed Users");
            embed.setDescription(`The following users have been removed from account #${account.id}: ${account.name}:\n\n${removedUsers.slice(0, -2)}`);
            embed.setFooter({ text: `Ash Economy | Requested by ${interaction.member.displayName}` });

            result.first().reply({ embeds: [ embed ] });
        } else if (interaction.customTags[0] === "promptDeleteAccount") {
            const account = client.economy.getAccount(interaction.customTags[1]);
            if (!account) return interaction.reply({ content: `Selected account #${interaction.customTags[1]} no longer exists.`, ephemeral: true });
            if (!account.hasPermission(interaction.user.id, client.economy.enums.permissions("DeleteAccount"))) return interaction.reply({ content: `You do not have Delete permissions on account #${account.id}.`, ephemeral: true });

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setTitle(`Delete Account #${account.id}`);
            embed.setDescription(`Are you sure you want to delete \`${account.name}\`?\nThis account has \`${account.balance.toLocaleString()} ${client.config.economy.moneySymbol}\` which will be **irretrievably lost** upon deletion.`);
            embed.setFooter({ text: `Ash Economy | Requested by ${interaction.member.displayName}` });

            const actionRow = new ActionRowBuilder();
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${interaction.user.id}%account, deleteAccount, ${account.id}`)
                    .setStyle(ButtonStyle.Danger)
                    .setLabel("Yes"),
                new ButtonBuilder()
                    .setCustomId(`${interaction.user.id}%account, cancelDeleteAccount`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("No")
            );

            interaction.reply({ embeds: [ embed ], components: [ actionRow ] });
        } else if (interaction.customTags[0] === "deleteAccount") {
            const account = client.economy.getAccount(interaction.customTags[1]);
            if (!account) return interaction.reply({ content: `Selected account #${interaction.customTags[1]} no longer exists.`, ephemeral: true });
            if (!account.hasPermission(interaction.user.id, client.economy.enums.permissions("DeleteAccount"))) return interaction.reply({ content: `You do not have Delete permissions on account #${account.id}.`, ephemeral: true });
            const embed = new EmbedBuilder();
            embed.setColor("#f70c0c");
            embed.setTitle("Account Deleted");
            embed.setDescription(`Account #${account.id}: ${account.name} was deleted.`);
            embed.setFooter({ text: `Ash Economy | Requested by ${interaction.member.displayName}` });
            account.delete();
            interaction.update({ embeds: [ embed ], components: [] });
        } else if (interaction.customTags[0] === "cancelDeleteAccount") {
            const embed = new EmbedBuilder();
            embed.setDescription("Account deletion was canceled.");
            embed.setFooter({ text: `Ash Economy | Requested by ${interaction.member.displayName}` });
            interaction.update({ embeds: [ embed ], components: [] });
        } else if (interaction.customTags[0] === "renameAccount") { // TODO: REPLACE THIS WITH A MODAL
            const account = client.economy.getAccount(interaction.customTags[1]);
            if (!account) return interaction.reply({ content: `Selected account #${interaction.customTags[1]} no longer exists.`, ephemeral: true });
            if (!account.hasPermission(interaction.user.id, client.economy.enums.permissions("RenameAccount"))) return interaction.reply({ content: `You do not have Rename permissions on account #${account.id}.`, ephemeral: true });

            await interaction.update({ components: [] });
            await interaction.followUp("What would you like to rename this account to? Max 64 characters.\n\nType \`cancel\` to cancel.");

            const result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id, max: 1, time: 60000, errors: ["time"] })
                .catch(() => interaction.editReply(":x: Account renaming timed out."));
            if (!result.first()) return;

            if (result.first().content.toLowerCase() === "cancel") return result.first().reply("Account renaming canceled.");

            account.name = result.first().content.slice(0, 64).replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

            const embed = new EmbedBuilder();
            embed.setColor("#32a852");
            embed.setTitle("Account Renamed");
            embed.setDescription(`Account #${account.id} has been renamed to ${account.name}.`);
            embed.setFooter({ text: `Ash Economy | Renamed by ${interaction.member.displayName}` });
            result.first().reply({ embeds: [ embed ] });
        }
    },
    applicationCommands: [
        {
            name: "account",
            description: "View details about an economy account.",
            type: 1, // Slash command
            options: [
                {
                    name: "account",
                    description: "Search for an account by name or ID",
                    required: true,
                    autocomplete: true,
                    type: 4,
                    minValue: 0
                }
            ],
            execute: function(client, interaction) {
                if (!client.stormworks.players.getSteamIdFromDiscordId(interaction.user.id)) {
                    const embed = new EmbedBuilder();
                    embed.setTitle("Not Linked");
                    embed.setDescription(`You must link your account to Stormworks before you can use Ash Economy.\n\nTo link your account, run \`${client.config.prefix}link\`.`);
                    return interaction.reply({ ephemeral: true, embeds: [ embed ] });
                }

                const account = client.economy.getAccount(interaction.options.get("account").value);
                if (!account) return interaction.reply({ ephemeral: true, content: "Account was not found." });

                const [embed, components] = generateAccountEmbed(client, account, interaction.member);

                interaction.reply({ embeds: [ embed ], components });
            },
            // autocopmlete search is still broken
            autocomplete: function(client, interaction) {
                if (interaction.options.get("account").value.length > 0) {
                    const primaryAccountId = client.economy.data.get("primaryAccounts", interaction.user.id);

                    const searchItems = [];
                    for (const [accountId, account] of client.economy.accounts) searchItems.push({ id: accountId, name: account.name,
                        owner: account.type === client.economy.enums.accountTypes("Personal") ? undefined
                        : account.type === client.economy.enums.accountTypes("Faction") ? client.factions.factions.get(account.ownerId).name
                        : account.type === client.economy.enums.accountTypes("Nation") ? client.nations.nations.get(account.ownerId).name
                        : undefined
                    });

                    const results = fuzzysort.go(interaction.options.get("account").value, searchItems, { keys: ["id", "name", "owner"], limit: 25, threshold: -100 });

                    const response = [];
                    for (const result of results) response.push({ name: `${Number(result.obj.id) === primaryAccountId ? "⭐ " : ""}[ ${result.obj.id} ] ${result.obj.name}`, value: Number(result.obj.id) });

                    interaction.respond(response);
                } else {
                    const response = [];
                    const primaryAccountId = client.economy.data.get("primaryAccounts", interaction.user.id);
                    for (const accountId of client.economy.getAccounts(interaction.user.id)) response.push({ name: `${accountId === primaryAccountId ? "⭐ " : ""}[ ${accountId} ] ${client.economy.accounts.get(accountId).name}`, value: accountId });
                    interaction.respond(response);
                }
            }
        }
    ]
}