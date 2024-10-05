// Ash Public
// @.fuckme
// * Compliance
// * This file is presented in its entire unmodified form.

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "erasedata",
    description: "Deletes a user's data.\nAll data will be erased without exception. This process cannot be reversed.\nTo be used for permanent bans and Right-to-be-forgotten compliance only.",
    usage: "erasedata [user]",
    category: "System",
    adminOnly: true,
    argsRequired: true,
    async execute(client, message, args) {
        const userId = args[0];

        const msg = await message.channel.send(`${client.config.emojis.loading} Searching`);

        const dataString = [];

        // Search primary account
        const primaryAccount = client.economy.getPrimaryAccount(userId, false);
        if (primaryAccount) dataString.push(`❌ Remove primary account association #${primaryAccount.id}`);
        // Search personal economy accounts
        for (const account of client.economy.accounts.map((_, id) => client.economy.getAccount(id)).filter(account => account.type === client.economy.enums.accountTypes("Personal"))) {
            if (account.owner === userId) dataString.push(`**♻️ Delete personal account #${account.id}** \`${account.name}\` (${account.balance.toLocaleString()} ${client.config.economy.moneySymbol})`);
            else if (account.getUsersWithPermission(client.economy.enums.permissions("UseAccount")).includes(userId)) dataString.push(`🚷 Remove from personal account #${account.id} \`${account.name}\``);
        }

        // Search factions
        for (const faction of client.factions.factions.map((_, id) => client.factions.getFaction(id))) {
            if (faction.ownerId === userId) {
                dataString.push(`**♻️ Delete faction #${faction.id}** \`${faction.name}\``);
                for (const account of faction.economyAccounts) dataString.push(`​ ​ ⳑ *♻️ Delete faction account #${account.id}* \`${account.name}\` (${account.balance.toLocaleString()} ${client.config.economy.moneySymbol})`);
            }
            else if (faction.getMember(userId)) dataString.push(`🚷 Remove from faction #${faction.id} \`${faction.name}\``);
            else if (faction.enmap.get(faction.id, "invitedMembers").includes(userId)) dataString.push(`🚷 Uninvite from faction #${faction.id} \`${faction.name}\``);
        }

        // Search nations
        for (const nation of client.nations.nations.map((_, id) => client.nations.getNation(id))) {
            if (nation.ownerId === userId) {
                dataString.push(`**♻️ Delete nation #${nation.id}** \`${nation.name}\``);
                dataString.push(`​ ​ ⳑ *⚠️ Orphan ${nation.factions.length} factions*`);
                for (const account of nation.economyAccounts) dataString.push(`​ ​ ⳑ *♻️ Delete nation account #${account.id}* \`${account.name}\` (${account.balance.toLocaleString()} ${client.config.economy.moneySymbol})`);
            }
            else if (nation.getMember(userId)) dataString.push(`🚷 Remove from nation #${nation.id} \`${nation.name}\``);
            else if (nation.enmap.get(nation.id, "invitedMembers").includes(userId)) dataString.push(`🚷 Uninvite from nation #${nation.id} \`${nation.name}\``);
        }

        // Search player data
        if (client.stormworks.players.getBan(userId)) dataString.push(`**⚠️ Convert ban to Steam ID**`);
        if (client.stormworks.players.getDataFromDiscordId(userId)) dataString.push(`**♻️ Delete player data**`);

        // End search

        if (dataString.length === 0) return msg.edit("No data found for user");

        const embed = new EmbedBuilder();
        embed.setColor(client.config.colors.red);
        embed.setTitle(":warning: Erase User Data");
        embed.setDescription(`**Are you really sure you would like to delete <@${userId}>'s data?**\nThis process cannot be reversed.\n\nThe following data has been found and will be removed:\n\n${dataString.join("\n")}`);
        embed.setFooter({ text: `Compliance | Requested by ${message.member.displayName}` });

        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%erasedata, confirm, ${userId}`)
                .setStyle(ButtonStyle.Danger)
                .setLabel("Yes"),
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%erasedata, cancel`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("No")
        );

        msg.edit({ embeds: [embed], components: [actionRow], content: "" });
    },
    async interaction(client, interaction) {
        if (interaction.customTags[0] === "confirm") {
            const userId = interaction.customTags[1];

            await interaction.update({ components: [] });
            const msg = await interaction.followUp(`${client.config.emojis.loading} Please wait`);

            const dataString = [];

            // Search primary account
            const primaryAccount = client.economy.getPrimaryAccount(userId, false);
            if (primaryAccount) {
                dataString.push(`❌ Remove primary account association #${primaryAccount.id}`);
                client.economy.data.delete("primaryAccounts", userId);
            }
            // Search personal economy accounts
            for (const account of client.economy.accounts.map((_, id) => client.economy.getAccount(id)).filter(account => account.type === client.economy.enums.accountTypes("Personal"))) {
                if (account.owner === userId) {
                    dataString.push(`**♻️ Delete personal account #${account.id}** \`${account.name}\` (${account.balance.toLocaleString()} ${client.config.economy.moneySymbol})`);
                    account.delete();
                }
                else if (account.getUsersWithPermission(client.economy.enums.permissions("UseAccount")).includes(userId)) {
                    dataString.push(`🚷 Remove from personal account #${account.id} \`${account.name}\``);
                    account.removeUser(userId);
                }
            }

            // Search factions
            for (const faction of client.factions.factions.map((_, id) => client.factions.getFaction(id))) {
                if (faction.ownerId === userId) {
                    dataString.push(`**♻️ Delete faction #${faction.id}** \`${faction.name}\``);
                    for (const account of faction.economyAccounts) {
                        dataString.push(`​ ​ ⳑ *♻️ Delete faction account #${account.id}* \`${account.name}\` (${account.balance.toLocaleString()} ${client.config.economy.moneySymbol})`);
                        account.delete(); // unnecessary, faction.delete() takes care of this
                    }
                    faction.delete();
                }
                else if (faction.getMember(userId)) {
                    dataString.push(`🚷 Remove from faction #${faction.id} \`${faction.name}\``);
                    faction.getMember(userId).delete();
                }
                else if (faction.enmap.get(faction.id, "invitedMembers").includes(userId)) {
                    dataString.push(`🚷 Uninvite from faction #${faction.id} \`${faction.name}\``);
                    faction.uninviteMember(userId);
                }
            }

            // Search nations
            for (const nation of client.nations.nations.map((_, id) => client.nations.getNation(id))) {
                if (nation.ownerId === userId) {
                    dataString.push(`**♻️ Delete nation #${nation.id}** \`${nation.name}\``);
                    dataString.push(`​ ​ ⳑ *⚠️ Orphan ${nation.factions.length} factions*`);
                    for (const account of nation.economyAccounts) {
                        dataString.push(`​ ​ ⳑ *♻️ Delete nation account #${account.id}* \`${account.name}\` (${account.balance.toLocaleString()} ${client.config.economy.moneySymbol})`);
                        account.delete();  // unnecessary, nation.delete() takes care of this
                    }
                    nation.delete();
                }
                else if (nation.getMember(userId)) {
                    dataString.push(`🚷 Remove from nation #${nation.id} \`${nation.name}\``);
                    nation.getMember(userId).delete();
                }
                else if (nation.enmap.get(nation.id, "invitedMembers").includes(userId)) {
                    dataString.push(`🚷 Uninvite from nation #${nation.id} \`${nation.name}\``);
                    nation.uninviteMember(userId);
                }
            }

            // Search player data
            /*if (client.stormworks.players.getBan(userId)) {
                dataString.push(`**⚠️ Convert ban to Steam ID**`);
                client.ssm.addBlacklist(client.stormworks.players.getSteamIdFromDiscordId(userId));
            }*/
            if (client.stormworks.players.getDataFromDiscordId(userId)) {
                dataString.push(`**♻️ Delete player data**`);
                client.stormworks.players.delete(userId);
            }

            // End deletion

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setTitle(":warning: User Data Erased");
            embed.setDescription(`**<@${userId}>'s data has been permanently deleted:**\n\n${dataString.join("\n")}`);
            embed.setFooter({ text: `Compliance | Requested by ${interaction.member.displayName}` });

            msg.edit({ embeds: [embed], components: [], content: "" });

            const user = await client.users.fetch(userId);
            const embed2 = new EmbedBuilder();
            embed2.setColor(client.config.colors.red);
            embed2.setTitle(":warning: Your user data has been erased");
            embed2.setDescription(`**Your data has been permanently deleted, as per your request.**\n\n${dataString.join("\n")}\n\nThank you for being a part of StormLands.`);
            embed2.setFooter({ text: "Compliance" });
            embed2.setThumbnail(interaction.guild.iconURL());
            user.send({ embeds: [embed2] });
        } else if (interaction.customTags[0] === "cancel") {
            const embed = new EmbedBuilder();
            embed.setDescription("Canceled.");
            embed.setFooter({ text: `Compliance | Requested by ${interaction.member.displayName}` });
            interaction.message.edit({ embeds: [embed], components: [] });
        }
    }
}