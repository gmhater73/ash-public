// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const fuzzysort = require("fuzzysort");

function generateFactionEmbed(client, faction, member) {
    const embed = new EmbedBuilder();
    embed.setColor(faction.color);
    embed.setThumbnail(faction.displayImage);
    embed.setTitle(`${faction.getMember(member.user.id) ? "⭐" : ""} ${faction.name}`);
    embed.setDescription(`${faction.description}\n\nCreated <t:${faction.creationTimestamp}:D>`);
    embed.addFields(
        { name: "Owner", value: `<@${faction.ownerId}>`, inline: true },
        { name: "Nation", value: faction.nation ? `${faction.nation.emoji} ${faction.nation.name}` : "None", inline: true }
    );

    let rankText = "";
    for (const rank of faction.ranks.sort((a, b) => b.displayOrder - a.displayOrder)) {
        let members = "";
        for (const member of rank.members) if (!member.isOwner) members += `<@${member.id}>, `;
        rankText += `**${rank.name}:** ${members === "" ? "None" : ((rank.members.length < 30 && faction.members.length < 50) ? members.slice(0, -2) : `${rank.members.length} members`)}\n`;
    }
    embed.addFields({ name: `Members (${faction.members.length - 1})`, value: rankText });

    if (faction.economyAccounts.length > 0) {
        let economyText = "";
        let combinedBalance = 0;
        for (const account of faction.economyAccounts) {
            combinedBalance += account.balance;
            economyText += `\`#${account.id}\` \`${account.name}\` \`${account.balance.toLocaleString()} ${client.config.economy.moneySymbol}\`\n`;
        }
        embed.addFields({ name: `Economy (${combinedBalance.toLocaleString()} ${client.config.economy.moneySymbol})`, value: economyText });
    }

    embed.setFooter({ text: `Ash Factions | Faction ID: ${faction.id} | Requested by ${member.displayName}` });

    const factionMember = faction.getMember(member.user.id);

    const components = [];
    if (factionMember) {
        const actionRow = new ActionRowBuilder();
        components[0] = actionRow;
        if (!factionMember.isOwner) {
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%faction, promptLeaveFaction, ${faction.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Leave")
                    .setEmoji("🚪")
            );
        }
        if (factionMember.canManageMembers) {
            const manageableMembers = (factionMember.isOwner ? faction.members : faction.members.filter(m => m.rank.displayOrder < factionMember.rank.displayOrder)).filter(m => m.id !== member.user.id);
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%faction, inviteMember, ${faction.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Invite Member")
                    .setEmoji("📥"),
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%faction, promptRankMember, ${faction.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Rank Member")
                    .setEmoji("🏅")
                    .setDisabled(manageableMembers.length < 1),
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%faction, kickMember, ${faction.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Kick Member")
                    .setEmoji("🚷")
                    .setDisabled(manageableMembers.length < 1)
            );
        }
        if (factionMember.canEditDetails) {
            const editActionRow = new ActionRowBuilder();
            components[1] = editActionRow;
            editActionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%faction, editDescription, ${faction.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Edit Description")
                    .setEmoji("📝"),
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%faction, editImage, ${faction.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Edit Image")
                    .setEmoji("📝"),
            );
        }
    } else if (faction.invitedMembers.includes(member.user.id)) {
        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${member.user.id}%faction, joinFaction, ${faction.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Join")
                .setEmoji("📥")
        );
        components[0] = actionRow;
    }

    return [embed, components];
}

module.exports = {
    name: "faction",
    description: "View details about a faction.",
    usage: "faction <OPTIONAL faction id / name>",
    category: "Factions",
    aliases: ["factions", "f"],
    async execute(client, message, args) {
        if (args[0]) {
            const searchItems = client.factions.factions.reduce((value, faction, id) => { value.push({ id, name: faction.name }); return value; }, []);
            //const faction = client.factions.getFaction(args[0]);
            const result = fuzzysort.go(args[0], searchItems, { keys: ["id", "name"], limit: 1, threshold: -100 })[0];
            const faction = result ? client.factions.getFaction(result.obj.id) : null;
            if (!faction) return message.channel.send("Faction was not found.");

            const [embed, components] = generateFactionEmbed(client, faction, message.member);

            message.channel.send({ embeds: [embed], components });
        } else {
            message.channel.send({ content: "Select a faction to view.", components: client.factions.generateFactionSelectMenu(message.author.id, `${message.author.id}%faction, selectFaction`) });
        }
    },
    async interaction(client, interaction) {
        if (interaction.customTags[0] === "selectFaction") {
            const faction = client.factions.getFaction((interaction.values ? interaction.values[0] : interaction.customTags[1]));
            if (!faction) return interaction.reply({ content: "Selected faction does not exist.", ephemeral: true });

            const [embed, components] = generateFactionEmbed(client, faction, interaction.member);

            interaction.reply({ embeds: [embed], components });
        } else if (interaction.customTags[0] === "joinFaction") {
            const faction = client.factions.getFaction(interaction.customTags[1]);
            if (!faction) return interaction.reply({ content: "Selected faction does not exist.", ephemeral: true });
            if (faction.getMember(interaction.user.id)) return interaction.reply({ content: `You are already a member of ${faction.name}.`, ephemeral: true });

            if (!client.stormworks.players.getSteamIdFromDiscordId(interaction.user.id)) {
                const embed = new EmbedBuilder();
                embed.setTitle("Not Linked");
                embed.setDescription(`You must link your account to Stormworks in order to join factions.\n\nTo link your account, run \`${client.config.prefix}link\`.`);
                return interaction.reply({ embeds: [embed] });
            }

            faction.uninviteMember(interaction.user.id);
            faction.addMember(interaction.user.id);

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.green);
            embed.setTitle("Joined Faction");
            embed.setDescription(`You are now a member of ${faction.name}.`);
            embed.setFooter({ text: `Ash Factions | Requested by ${interaction.member.displayName}` });

            await interaction.update({ components: [] });
            interaction.followUp({ embeds: [embed] });
        } else if (interaction.customTags[0] === "promptLeaveFaction") {
            const faction = client.factions.getFaction(interaction.customTags[1]);
            if (!faction) return interaction.reply({ content: "Selected faction does not exist.", ephemeral: true });
            if (!faction.getMember(interaction.user.id)) return interaction.reply({ content: `You are not a member of ${faction.name}.`, ephemeral: true });

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setTitle(`Leave Faction`);
            embed.setDescription(`Are you sure you want to leave ${faction.name}?\nYou will not be able to join back without without an invite.`);
            embed.setFooter({ text: `Ash Factions | Requested by ${interaction.member.displayName}` });

            const actionRow = new ActionRowBuilder();
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${interaction.user.id}%faction, leaveFaction, ${faction.id}`)
                    .setStyle(ButtonStyle.Danger)
                    .setLabel("Yes"),
                new ButtonBuilder()
                    .setCustomId(`${interaction.user.id}%faction, cancel`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("No")
            );

            interaction.reply({ embeds: [embed], components: [actionRow] });
        } else if (interaction.customTags[0] === "leaveFaction") {
            const faction = client.factions.getFaction(interaction.customTags[1]);
            if (!faction) return interaction.reply({ content: "Selected faction does not exist.", ephemeral: true });
            if (!faction.getMember(interaction.user.id)) return interaction.reply({ content: "You are not a member of this faction.", ephemeral: true });
            faction.getMember(interaction.user.id).delete();
            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setTitle("Faction Left");
            embed.setDescription(`You have left ${faction.name}.`);
            embed.setFooter({ text: `Ash Factions | Requested by ${interaction.member.displayName}` });
            interaction.update({ embeds: [embed], components: [] });
        } else if (interaction.customTags[0] === "inviteMember") {
            const faction = client.factions.getFaction(interaction.customTags[1]);
            if (!faction) return interaction.reply({ content: "Selected faction does not exist.", ephemeral: true });
            const factionMember = faction.getMember(interaction.user.id);
            if (!factionMember) return interaction.reply({ content: "You are not a member of this faction.", ephemeral: true });
            if (!factionMember.canManageMembers) return interaction.reply({ content: "You do not have permission to manage members in this faction.", ephemeral: true });

            await interaction.update({ components: [] });
            await interaction.followUp(`Please mention or provide the IDs of the users that you would like to invite to this faction.\n\nType \`cancel\` to cancel.`);

            const result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id, max: 1, time: 300000, errors: ["time"] })
                .catch(() => interaction.editReply(":x: Inviting members timed out."));
            if (!result.first()) return;

            if (result.first().content.toLowerCase() === "cancel") return result.first().reply("Inviting members canceled.");

            const users = (await client.getUsers(result.first(), result.first().content)).map(user => user.id).filter(userId => client.stormworks.players.getSteamIdFromDiscordId(userId));
            if (users.length < 1) return result.first().reply("No valid users were provided.");

            let addedMembers = "";
            for (const userId of users) {
                if (faction.inviteMember(userId)); addedMembers += `<@${userId}>, `;
            }

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.green);
            embed.setTitle("Invited Members");
            embed.setDescription(`The following members have been invited to ${faction.name}:\n\n${addedMembers.slice(0, -2)}\n\nThey can accept the invite by running \`${client.config.prefix}faction\`, selecting this faction, and clicking Join.`);
            embed.setFooter({ text: `Ash Factions | Requested by ${interaction.member.displayName}` });

            result.first().reply({ embeds: [embed] });
        } else if (interaction.customTags[0] === "kickMember") {
            const faction = client.factions.getFaction(interaction.customTags[1]);
            if (!faction) return interaction.reply({ content: "Selected faction does not exist.", ephemeral: true });
            const factionMember = faction.getMember(interaction.user.id);
            if (!factionMember) return interaction.reply({ content: "You are not a member of this faction.", ephemeral: true });
            if (!factionMember.canManageMembers) return interaction.reply({ content: "You do not have permission to manage members in this faction.", ephemeral: true });

            // Clean up faction members - remove those who are no longer in the guild
            const availableUsers = await interaction.guild.members.fetch({ user: faction.members.map(member => member.id) });
            for (const member of faction.members) { try { const user = availableUsers.get(member.id); if (!user) faction.getMember(member.id).delete(); } catch { faction.getMember(member.id).delete(); } }

            const manageableMembers = (factionMember.isOwner ? faction.members : faction.members.filter(member => member.rank.displayOrder < factionMember.rank.displayOrder)).filter(member => member.id !== interaction.user.id).map(member => member.id);
            if (manageableMembers.length <= 0) return interaction.reply({ content: "This faction has no citizens that you have permission to kick.", ephemeral: true });

            await interaction.update({ components: [] });
            await interaction.followUp(`Please mention or provide the IDs of the members that you would like to kick.\nYou have the ability to kick members from ${faction.owner === interaction.user.id ? "all ranks" : `the following ranks: ${Object.values(faction.ranks).filter(rank => rank.displayOrder < factionMember.rank.displayOrder).map(rank => rank.name).join(", ")}`}.\n\nType \`cancel\` to cancel.`);

            const result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id, max: 1, time: 300000, errors: ["time"] })
                .catch(() => interaction.editReply(":x: Member removal timed out."));
            if (!result.first()) return;

            if (result.first().content.toLowerCase() === "cancel") return result.first().reply("Member removal canceled.");

            const users = (await client.getUsers(result.first(), result.first().content)).map(user => user.id).filter(user => manageableMembers.includes(user));
            if (users.length < 1) return result.first().reply("No valid users were provided.");

            let removedMembers = "";
            for (const userId of users) {
                if (faction.getMember(userId).delete()); removedMembers += `<@${userId}>, `;
            }

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setTitle("Kicked Members");
            embed.setDescription(`The following members have been kicked from ${faction.name}:\n\n${removedMembers.slice(0, -2)}`);
            embed.setFooter({ text: `Ash Factions | Requested by ${interaction.member.displayName}` });

            result.first().reply({ embeds: [embed] });
        } else if (interaction.customTags[0] === "promptRankMember") {
            const faction = client.factions.getFaction(interaction.customTags[1]);
            if (!faction) return interaction.reply({ content: "Selected faction does not exist.", ephemeral: true });
            const factionMember = faction.getMember(interaction.user.id);
            if (!factionMember) return interaction.reply({ content: "You are not a member of this faction.", ephemeral: true });
            if (!factionMember.canManageMembers) return interaction.reply({ content: "You do not have permission to manage members in this faction.", ephemeral: true });

            const actionRow = new ActionRowBuilder();
            const selectMenu = new SelectMenuBuilder();
            selectMenu.setCustomId(`${interaction.user.id}%faction, rankMember, ${faction.id}`);
            selectMenu.setPlaceholder("No rank selected");

            for (const rank of (factionMember.isOwner ? faction.ranks : faction.ranks.filter(rank => rank.displayOrder < factionMember.rank.displayOrder)).sort((a, b) => b.displayOrder - a.displayOrder)) {
                selectMenu.addOptions({
                    label: rank.name,
                    value: rank.id.toString()
                });
            }
            actionRow.addComponents(selectMenu);

            await interaction.update({ components: [] });
            interaction.followUp({
                content: "Select the rank that you will be ranking members to.", components: [actionRow,
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`${interaction.user.id}%faction, cancel`)
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel("Cancel")
                    )
                ]
            });
        } else if (interaction.customTags[0] === "rankMember") {
            const faction = client.factions.getFaction(interaction.customTags[1]);
            if (!faction) return interaction.reply({ content: "Selected faction does not exist.", ephemeral: true });
            const factionMember = faction.getMember(interaction.user.id);
            if (!factionMember) return interaction.reply({ content: "You are not a member of this faction.", ephemeral: true });
            if (!factionMember.canManageMembers) return interaction.reply({ content: "You do not have permission to manage members in this faction.", ephemeral: true });

            const rank = faction.getRank(interaction.values[0]);
            if (!rank) return interaction.reply({ content: "Selected rank does not exist.", ephemeral: true });

            const manageableMembers = (factionMember.isOwner ? faction.members : faction.members.filter(member => member.rank.displayOrder < factionMember.rank.displayOrder)).filter(member => member.id !== interaction.user.id).map(member => member.id);
            if (manageableMembers.length <= 0) return interaction.reply({ content: "This faction has no members that you have permission to rank.", ephemeral: true });

            await interaction.update({ content: `Please mention or provide the IDs of the members that you would like to rank to ${rank.name}.\nYou have the ability to rank members from ${factionMember.isOwner ? "all ranks" : `the following ranks: ${faction.ranks.filter(rank => rank.displayOrder < factionMember.rank.displayOrder).map(rank => rank.name).join(", ")}`}.\n\nType \`cancel\` to cancel.`, components: [] });

            const result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id, max: 1, time: 300000, errors: ["time"] })
                .catch(() => interaction.editReply(":x: Member ranking timed out."));
            if (!result || !result.first()) return;

            if (result.first().content.toLowerCase() === "cancel") return result.first().reply("Member ranking canceled.");

            const users = (await client.getUsers(result.first(), result.first().content)).map(user => user.id).filter(user => manageableMembers.includes(user));
            if (users.length < 1) return result.first().reply("No valid users were provided.");

            let rankedMembers = "";
            for (const userId of users) {
                faction.getMember(userId).rankId = rank.id;
                rankedMembers += `<@${userId}>, `;
            }

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.green);
            embed.setTitle("Ranked Members");
            embed.setDescription(`The following members have been ranked to ${rank.name}:\n\n${rankedMembers.slice(0, -2)}`);
            embed.setFooter({ text: `Ash Factions | Requested by ${interaction.member.displayName}` });

            result.first().reply({ embeds: [embed] });
        } else if (interaction.customTags[0] === "editDescription") { // TODO: REPLACE THIS WITH A MODAL
            const faction = client.factions.getFaction(interaction.customTags[1]);
            if (!faction) return interaction.reply({ content: "Selected faction does not exist.", ephemeral: true });
            const factionMember = faction.getMember(interaction.user.id);
            if (!factionMember) return interaction.reply({ content: "You are not a member of this faction.", ephemeral: true });
            if (!factionMember.canEditDetails) return interaction.reply({ content: "You do not have permission to edit this faction's details.", ephemeral: true });

            await interaction.update({ components: [] });
            await interaction.followUp("What would you like to set the description of this faction to?\nMax 800 characters, multiline and formatting supported.\n\nType \`cancel\` to cancel.");

            const result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id && message.content.length <= 800, max: 1, time: 300000, errors: ["time"] })
                .catch(() => interaction.editReply(":x: Faction editing timed out."));
            if (!result.first()) return;

            if (result.first().content.toLowerCase() === "cancel") return result.first().reply("Faction editing canceled.");

            faction.description = result.first().content;

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.green);
            embed.setTitle("Faction Description Set");
            embed.setDescription(`The description for faction ${faction.name} has been set.`);
            embed.addFields({ name: "Description", value: faction.description });
            embed.setFooter({ text: `Ash Factions | Requested by ${interaction.member.displayName}` });
            result.first().reply({ embeds: [ embed ] });
        } else if (interaction.customTags[0] === "editImage") { // TODO: REPLACE THIS WITH A MODAL
            const faction = client.factions.getFaction(interaction.customTags[1]);
            if (!faction) return interaction.reply({ content: "Selected faction does not exist.", ephemeral: true });
            const factionMember = faction.getMember(interaction.user.id);
            if (!factionMember) return interaction.reply({ content: "You are not a member of this faction.", ephemeral: true });
            if (!factionMember.canEditDetails) return interaction.reply({ content: "You do not have permission to edit this faction's details.", ephemeral: true });

            await interaction.update({ components: [] });
            await interaction.followUp("What would you like to set the image of this faction to?\n\nType \`cancel\` to cancel.");

            let result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id && (message.content.toLowerCase() === "cancel" || message.content.includes("https://") || (message.attachments.size > 0 && message.attachments.first().contentType.includes("image"))), max: 1, time: 300000, errors: ["time"] })
            .catch(() => interaction.editReply(":x: Faction editing timed out."));
            if (!result.first()) return;

            result = result.first();

            if (result.content.toLowerCase() === "cancel") return result.reply("Faction editing canceled.");

            faction.displayImage = result.content.includes("https://") ? result.content : result.attachments.first().url;

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.green);
            embed.setTitle("Faction Image Set");
            embed.setDescription(`The image for faction ${faction.name} has been set.`);
            embed.setThumbnail(faction.displayImage);
            embed.setFooter({ text: `Ash Factions | Requested by ${interaction.member.displayName}` });
            result.reply({ embeds: [ embed ] });
        } else if (interaction.customTags[0] === "cancel") {
            const embed = new EmbedBuilder();
            embed.setDescription("Canceled.");
            embed.setFooter({ text: `Ash Factions | Requested by ${interaction.member.displayName}` });
            interaction.update({ content: "", embeds: [embed], components: [] });
        }
    },
    applicationCommands: [
        {
            name: "faction",
            description: "View details about a faction.",
            type: 1, // Slash command
            options: [
                {
                    name: "faction",
                    description: "Search for a faction by name, description, nation or ID",
                    required: true,
                    autocomplete: true,
                    type: 4,
                    minValue: 0
                }
            ],
            execute: function(client, interaction) {
                const faction = client.factions.getFaction(interaction.options.get("faction").value);
                if (!faction) return interaction.reply({ ephemeral: true, content: "Faction was not found." });

                const [embed, components] = generateFactionEmbed(client, faction, interaction.member);

                interaction.reply({ embeds: [ embed ], components });
            },
            // autocomplete search is broken
            autocomplete: function(client, interaction) {
                if (interaction.options.get("faction").value.length > 0) {
                    const searchItems = client.factions.factions.reduce((value, faction, id) => { value.push({ id, name: faction.name, description: faction.description, shortDescription: faction.shortDescription, nationName: client.nations.nations.has(faction.nationId) ? client.nations.nations.get(faction.nationId).name : undefined }); return value; }, []);

                    const results = fuzzysort.go(interaction.options.get("faction").value, searchItems, { keys: ["id", "name", "description", "shortDescription", "nationName"], limit: 25, threshold: -100 });

                    const response = [];
                    for (const result of results) response.push({ name: `[ ${result.obj.id} ] ${result.obj.name}`, value: Number(result.obj.id) });

                    interaction.respond(response);
                } else {
                    const response = [];
                    for (const factionId of client.factions.getFactions(interaction.user.id)) response.push({ name: `[ ${factionId} ] ${client.factions.factions.get(factionId).name}`, value: factionId });
                    interaction.respond(response);
                }
            }
        }
    ]
}