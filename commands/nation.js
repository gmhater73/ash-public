// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const fuzzysort = require("fuzzysort");

function generateNationEmbed(client, nation, member) {
    const embed = new EmbedBuilder();
    embed.setColor(nation.color);
    embed.setThumbnail(nation.displayImage);
    embed.setTitle(`${nation.getMember(member.user.id) ? "⭐" : nation.emoji} ${nation.name}`);
    embed.setDescription(`${nation.description}\n\n${nation.factions.length} factions\nCreated <t:${nation.creationTimestamp}:D>`);
    embed.addFields({ name: "Owner", value: `<@${nation.ownerId}>`, inline: true });
    
    let rankText = "";
    for (const rank of nation.ranks.sort((a, b) => b.displayOrder - a.displayOrder)) {
        let members = "";
        for (const member of rank.members) if (!member.isOwner) members += `<@${member.id}>, `;
        rankText += `**${rank.name}:** ${members === "" ? "None" : ((rank.members.length < 30 && nation.members.length < 50) ? members.slice(0, -2) : `${rank.members.length} members`)}\n`;
    }
    embed.addFields({ name: `Citizens (${nation.members.length - 1})`, value: rankText });

    if (nation.economyAccounts.length > 0) {
        let economyText = "";
        let combinedBalance = 0;
        for (const account of nation.economyAccounts) {
            combinedBalance += account.balance;
            economyText += `\`#${account.id}\` \`${account.name}\` \`${account.balance.toLocaleString()} ${client.config.economy.moneySymbol}\`\n`;
        }
        embed.addFields({ name: `Economy (${combinedBalance.toLocaleString()} ${client.config.economy.moneySymbol})`, value: economyText });
    }

    embed.setFooter({ text: `Ash Nations | Nation ID: ${nation.id} | Requested by ${member.displayName}` });

    const nationMember = nation.getMember(member.user.id);

    const components = [];
    if (nationMember) {
        const actionRow = new ActionRowBuilder();
        components[0] = actionRow;
        if (nationMember.isOwner) {
            /*const actionRow2 = new ActionRowBuilder();
            actionRow2.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%nation, configureNation, ${nation.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Configure Nation")
                    .setEmoji("⚙️"),
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%nation, configureNation, ${nation.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Configure Ranks")
                    .setEmoji("⚙️")
            );
            components[1] = actionRow2;*/
        } else {
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%nation, promptLeaveNation, ${nation.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Leave")
                    .setEmoji("🚪")
            );
        }
        if (nationMember.canManageMembers) {
            const manageableCitizens = (nationMember.isOwner ? nation.members : nation.members.filter(m => m.rank.displayOrder < nationMember.rank.displayOrder)).filter(m => m.id !== member.user.id);
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%nation, inviteCitizen, ${nation.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Invite Citizen")
                    .setEmoji("📥"),
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%nation, promptRankCitizen, ${nation.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Rank Citizen")
                    .setEmoji("🏅")
                    .setDisabled(manageableCitizens.length < 1),
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%nation, kickCitizen, ${nation.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Kick Citizen")
                    .setEmoji("🚷")
                    .setDisabled(manageableCitizens.length < 1)
            );
        }
        if (nationMember.canEditDetails) {
            const editActionRow = new ActionRowBuilder();
            components[1] = editActionRow;
            editActionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%nation, editDescription, ${nation.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Edit Description")
                    .setEmoji("📝"),
                new ButtonBuilder()
                    .setCustomId(`${member.user.id}%nation, editImage, ${nation.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Edit Image")
                    .setEmoji("📝"),
            );
        }
    } else if (nation.invitedMembers.includes(member.user.id)) {
        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${member.user.id}%nation, joinNation, ${nation.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Join")
                .setEmoji("📥")
        );
        components[0] = actionRow;
    }

    return [embed, components];
}

module.exports = {
    name: "nation",
    description: "View details about a nation.",
    usage: "nation <OPTIONAL nation id / name>",
    category: "Nations",
    aliases: ["nations", "n"],
    async execute(client, message, args) {
        if (args[0]) {
            const searchItems = client.nations.nations.reduce((value, nation, id) => { value.push({ id, name: nation.name }); return value; }, []);
            //const nation = client.nations.getNation(args[0]);
            const result = fuzzysort.go(args[0], searchItems, { keys: ["id", "name"], limit: 1, threshold: -100 })[0];
            const nation = result ? client.nations.getNation(result.obj.id) : null;
            if (!nation) return message.channel.send("Nation was not found.");

            const [embed, components] = generateNationEmbed(client, nation, message.member);

            message.channel.send({ embeds: [embed], components });
        } else {
            message.channel.send({
                content: "Select a nation to view.", components: [
                    new ActionRowBuilder().addComponents(
                        client.nations.generateNationSelectMenu(message.author.id)
                            .setCustomId(`${message.author.id}%nation, selectNation`)
                    )
                ]
            });
        }
    },
    async interaction(client, interaction) {
        if (interaction.customTags[0] === "selectNation") {
            const nation = client.nations.getNation(interaction.values ? interaction.values[0] : interaction.customTags[1]);
            if (!nation) return interaction.reply({ content: "Selected nation does not exist.", ephemeral: true });

            const [embed, components] = generateNationEmbed(client, nation, interaction.member);

            interaction.reply({ embeds: [embed], components });
        } else if (interaction.customTags[0] === "joinNation") {
            const nation = client.nations.getNation(interaction.customTags[1]);
            if (!nation) return interaction.reply({ content: "Selected nation does not exist.", ephemeral: true });
            if (nation.getMember(interaction.user.id)) return interaction.reply({ content: `You are already a citizen of ${nation.name}.`, ephemeral: true });

            if (!client.stormworks.players.getSteamIdFromDiscordId(interaction.user.id)) {
                const embed = new EmbedBuilder();
                embed.setTitle("Not Linked");
                embed.setDescription(`You must link your account to Stormworks in order to join nations.\n\nTo link your account, run \`${client.config.prefix}link\`.`);
                return interaction.reply({ embeds: [embed] });
            }

            nation.uninviteMember(interaction.user.id);
            nation.addMember(interaction.user.id);

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.green);
            embed.setTitle("Joined Nation");
            embed.setDescription(`You are now a citizen of ${nation.name}.\n\nThis nation may impose taxes on your transactions. Please review all transactions before approving them.`);
            embed.setFooter({ text: `Ash Nations | Requested by ${interaction.member.displayName}` });

            await interaction.update({ components: [] });
            interaction.followUp({ embeds: [embed] });
        } else if (interaction.customTags[0] === "promptLeaveNation") {
            const nation = client.nations.getNation(interaction.customTags[1]);
            if (!nation) return interaction.reply({ content: "Selected nation does not exist.", ephemeral: true });
            if (!nation.getMember(interaction.user.id)) return interaction.reply({ content: `You are not a citizen of ${nation.name}.`, ephemeral: true });

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setTitle(`Leave Nation`);
            embed.setDescription(`Are you sure you want to leave ${nation.name}?\nYou will not be able to join back without an invite.`);
            embed.setFooter({ text: `Ash Nations | Requested by ${interaction.member.displayName}` });

            const actionRow = new ActionRowBuilder();
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${interaction.user.id}%nation, leaveNation, ${nation.id}`)
                    .setStyle(ButtonStyle.Danger)
                    .setLabel("Yes"),
                new ButtonBuilder()
                    .setCustomId(`${interaction.user.id}%nation, cancel`)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("No")
            );

            interaction.reply({ embeds: [embed], components: [actionRow] });
        } else if (interaction.customTags[0] === "leaveNation") {
            const nation = client.nations.getNation(interaction.customTags[1]);
            if (!nation) return interaction.reply({ content: "Selected nation does not exist.", ephemeral: true });
            if (!nation.getMember(interaction.user.id)) return interaction.reply({ content: "You are not a citizen of this nation.", ephemeral: true });
            nation.getMember(interaction.user.id).delete();
            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setTitle("Nation Left");
            embed.setDescription(`You have left ${nation.name}.`);
            embed.setFooter({ text: `Ash Nations | Requested by ${interaction.member.displayName}` });
            interaction.update({ embeds: [embed], components: [] });
        } else if (interaction.customTags[0] === "inviteCitizen") {
            const nation = client.nations.getNation(interaction.customTags[1]);
            if (!nation) return interaction.reply({ content: "Selected nation does not exist.", ephemeral: true });
            const nationMember = nation.getMember(interaction.user.id);
            if (!nationMember) return interaction.reply({ content: "You are not a member of this nation.", ephemeral: true });
            if (!nationMember.canManageMembers) return interaction.reply({ content: "You do not have permission to manage members in this nation.", ephemeral: true });

            await interaction.update({ components: [] });
            await interaction.followUp(`Please mention or provide the IDs of the users that you would like to invite to this nation.\n\nType \`cancel\` to cancel.`);

            const result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id, max: 1, time: 300000, errors: ["time"] })
                .catch(() => interaction.editReply(":x: Inviting members timed out."));
            if (!result.first()) return;

            if (result.first().content.toLowerCase() === "cancel") return result.first().reply("Inviting members canceled.");

            const users = (await client.getUsers(result.first(), result.first().content)).map(user => user.id).filter(userId => client.stormworks.players.getSteamIdFromDiscordId(userId));
            if (users.length < 1) return result.first().reply("No valid users were provided.");

            let addedCitizens = "";
            for (const userId of users) {
                if (nation.inviteMember(userId)); addedCitizens += `<@${userId}>, `;
            }

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.green);
            embed.setTitle("Invited Citizens");
            embed.setDescription(`The following citizens have been invited to ${nation.name}:\n\n${addedCitizens.slice(0, -2)}\n\nThey can accept the invite by running \`${client.config.prefix}nation\`, selecting this nation, and clicking Join.`);
            embed.setFooter({ text: `Ash Nations | Requested by ${interaction.member.displayName}` });

            result.first().reply({ embeds: [embed] });
        } else if (interaction.customTags[0] === "kickCitizen") {
            const nation = client.nations.getNation(interaction.customTags[1]);
            if (!nation) return interaction.reply({ content: "Selected nation does not exist.", ephemeral: true });
            const nationMember = nation.getMember(interaction.user.id);
            if (!nationMember) return interaction.reply({ content: "You are not a member of this nation.", ephemeral: true });
            if (!nationMember.canManageMembers) return interaction.reply({ content: "You do not have permission to manage members in this nation.", ephemeral: true });

            // Clean up nation citizens - remove those who are no longer in the guild
            const availableUsers = await interaction.guild.members.fetch({ user: nation.members.map(member => member.id) });
            for (const member of nation.members) { try { const user = availableUsers.get(member.id); if (!user) nation.getMember(member.id).delete(); } catch { nation.getMember(member.id).delete(); } }

            const manageableCitizens = (nationMember.isOwner ? nation.members : nation.members.filter(member => member.rank.displayOrder < nationMember.rank.displayOrder)).filter(member => member.id !== interaction.user.id).map(member => member.id);
            if (manageableCitizens.length <= 0) return interaction.reply({ content: "This nation has no citizens that you have permission to kick.", ephemeral: true });

            await interaction.update({ components: [] });
            await interaction.followUp(`Please mention or provide the IDs of the citizens that you would like to kick.\nYou have the ability to kick citizens from ${nation.owner === interaction.user.id ? "all ranks" : `the following ranks: ${nation.ranks.filter(rank => rank.displayOrder < nationMember.rank.displayOrder).map(rank => rank.name).join(", ")}`}.\n\nType \`cancel\` to cancel.`);

            const result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id, max: 1, time: 300000, errors: ["time"] })
                .catch(() => interaction.editReply(":x: Citizen removal timed out."));
            if (!result.first()) return;

            if (result.first().content.toLowerCase() === "cancel") return result.first().reply("Citizen removal canceled.");

            const users = (await client.getUsers(result.first(), result.first().content)).map(user => user.id).filter(user => manageableCitizens.includes(user));
            if (users.length < 1) return result.first().reply("No valid users were provided.");

            let removedCitizens = "";
            for (const userId of users) {
                if (nation.getMember(userId).delete()); removedCitizens += `<@${userId}>, `;
            }

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setTitle("Kicked Citizens");
            embed.setDescription(`The following citizens have been kicked from ${nation.name}:\n\n${removedCitizens.slice(0, -2)}`);
            embed.setFooter({ text: `Ash Nations | Requested by ${interaction.member.displayName}` });

            result.first().reply({ embeds: [embed] });
        } else if (interaction.customTags[0] === "promptRankCitizen") {
            const nation = client.nations.getNation(interaction.customTags[1]);
            if (!nation) return interaction.reply({ content: "Selected nation does not exist.", ephemeral: true });
            const nationMember = nation.getMember(interaction.user.id);
            if (!nationMember) return interaction.reply({ content: "You are not a member of this nation.", ephemeral: true });
            if (!nationMember.canManageMembers) return interaction.reply({ content: "You do not have permission to manage members in this nation.", ephemeral: true });

            const actionRow = new ActionRowBuilder();
            const selectMenu = new SelectMenuBuilder();
            selectMenu.setCustomId(`${interaction.user.id}%nation, rankCitizen, ${nation.id}`);
            selectMenu.setPlaceholder("No rank selected");

            for (const rank of (nationMember.isOwner ? nation.ranks : nation.ranks.filter(rank => rank.displayOrder < nationMember.rank.displayOrder)).sort((a, b) => b.displayOrder - a.displayOrder)) {
                selectMenu.addOptions({
                    label: rank.name,
                    value: rank.id.toString()
                });
            }
            actionRow.addComponents(selectMenu);

            await interaction.update({ components: [] });
            interaction.followUp({
                content: "Select the rank that you will be ranking citizens to.", components: [actionRow,
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`${interaction.user.id}%nation, cancel`)
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel("Cancel")
                    )
                ]
            });
        } else if (interaction.customTags[0] === "rankCitizen") {
            const nation = client.nations.getNation(interaction.customTags[1]);
            if (!nation) return interaction.reply({ content: "Selected nation does not exist.", ephemeral: true });
            const nationMember = nation.getMember(interaction.user.id);
            if (!nationMember) return interaction.reply({ content: "You are not a member of this nation.", ephemeral: true });
            if (!nationMember.canManageMembers) return interaction.reply({ content: "You do not have permission to manage members in this nation.", ephemeral: true });

            const rank = nation.getRank(interaction.values[0]);
            if (!rank) return interaction.reply({ content: "Selected rank does not exist.", ephemeral: true });

            const manageableCitizens = (nationMember.isOwner ? nation.members : nation.members.filter(member => member.rank.displayOrder < nationMember.rank.displayOrder)).filter(member => member.id !== interaction.user.id).map(member => member.id);
            if (manageableCitizens.length <= 0) return interaction.reply({ content: "This nation has no citizens that you have permission to rank.", ephemeral: true });

            await interaction.update({ content: `Please mention or provide the IDs of the citizens that you would like to rank to ${rank.name}.\nYou have the ability to rank citizens from ${nationMember.isOwner ? "all ranks" : `the following ranks: ${nation.ranks.filter(rank => rank.displayOrder < nationMember.rank.displayOrder).map(rank => rank.name).join(", ")}`}.\n\nType \`cancel\` to cancel.`, components: [] });

            const result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id, max: 1, time: 300000, errors: ["time"] })
                .catch(() => interaction.editReply(":x: Citizen ranking timed out."));
            if (!result.first()) return;

            if (result.first().content.toLowerCase() === "cancel") return result.first().reply("Citizen ranking canceled.");

            const users = (await client.getUsers(result.first(), result.first().content)).map(user => user.id).filter(user => manageableCitizens.includes(user));
            if (users.length < 1) return result.first().reply("No valid users were provided.");

            let rankedCitizens = "";
            for (const userId of users) {
                nation.getMember(userId).rankId = rank.id;
                rankedCitizens += `<@${userId}>, `;
            }

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.green);
            embed.setTitle("Ranked Citizens");
            embed.setDescription(`The following citizens have been ranked to ${rank.name}:\n\n${rankedCitizens.slice(0, -2)}`);
            embed.setFooter({ text: `Ash Nations | Requested by ${interaction.member.displayName}` });

            result.first().reply({ embeds: [embed] });
        } else if (interaction.customTags[0] === "editDescription") { // TODO: REPLACE THIS WITH A MODAL
            const nation = client.nations.getNation(interaction.customTags[1]);
            if (!nation) return interaction.reply({ content: "Selected nation does not exist.", ephemeral: true });
            const nationMember = nation.getMember(interaction.user.id);
            if (!nationMember) return interaction.reply({ content: "You are not a member of this nation.", ephemeral: true });
            if (!nationMember.canEditDetails) return interaction.reply({ content: "You do not have permission to edit this nation's details.", ephemeral: true });

            await interaction.update({ components: [] });
            await interaction.followUp("What would you like to set the description of this nation to?\nMax 800 characters, multiline and formatting supported.\n\nType \`cancel\` to cancel.");

            const result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id && message.content.length <= 800, max: 1, time: 300000, errors: ["time"] })
                .catch(() => interaction.editReply(":x: Nation editing timed out."));
            if (!result.first()) return;

            if (result.first().content.toLowerCase() === "cancel") return result.first().reply("Nation editing canceled.");

            nation.description = result.first().content;

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.green);
            embed.setTitle("Nation Description Set");
            embed.setDescription(`The description for Nation ${nation.name} has been set.`);
            embed.addFields({ name: "Description", value: nation.description });
            embed.setFooter({ text: `Ash Nations | Requested by ${interaction.member.displayName}` });
            result.first().reply({ embeds: [ embed ] });
        } else if (interaction.customTags[0] === "editImage") { // TODO: REPLACE THIS WITH A MODAL
            const nation = client.nations.getNation(interaction.customTags[1]);
            if (!nation) return interaction.reply({ content: "Selected nation does not exist.", ephemeral: true });
            const nationMember = nation.getMember(interaction.user.id);
            if (!nationMember) return interaction.reply({ content: "You are not a member of this nation.", ephemeral: true });
            if (!nationMember.canEditDetails) return interaction.reply({ content: "You do not have permission to edit this nation's details.", ephemeral: true });

            await interaction.update({ components: [] });
            await interaction.followUp("What would you like to set the image of this nation to?\n\nType \`cancel\` to cancel.");

            let result = await interaction.channel.awaitMessages({ filter: message => message.author.id === interaction.user.id && (message.content.toLowerCase() === "cancel" || message.content.includes("https://") || (message.attachments.size > 0 && message.attachments.first().contentType.includes("image"))), max: 1, time: 300000, errors: ["time"] })
            .catch(() => interaction.editReply(":x: Nation editing timed out."));
            if (!result.first()) return;

            result = result.first();

            if (result.content.toLowerCase() === "cancel") return result.reply("Nation editing canceled.");

            nation.displayImage = result.content.includes("https://") ? result.content : result.attachments.first().url;

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.green);
            embed.setTitle("Nation Image Set");
            embed.setDescription(`The image for nation ${nation.name} has been set.`);
            embed.setThumbnail(nation.displayImage);
            embed.setFooter({ text: `Ash Nations | Requested by ${interaction.member.displayName}` });
            result.reply({ embeds: [ embed ] });
        } else if (interaction.customTags[0] === "cancel") {
            const embed = new EmbedBuilder();
            embed.setDescription("Canceled.");
            embed.setFooter({ text: `Ash Nations | Requested by ${interaction.member.displayName}` });
            interaction.update({ content: "", embeds: [embed], components: [] });
        }
    },
    applicationCommands: [
        {
            name: "nation",
            description: "View details about a nation.",
            type: 1, // Slash command
            options: [
                {
                    name: "nation",
                    description: "Search for a nation by name, description or ID",
                    required: true,
                    autocomplete: true,
                    type: 4,
                    minValue: 0
                }
            ],
            execute: function(client, interaction) {
                const nation = client.nations.getNation(interaction.options.get("nation").value);
                if (!nation) return interaction.reply({ ephemeral: true, content: "Nation was not found." });

                const [embed, components] = generateNationEmbed(client, nation, interaction.member);

                interaction.reply({ embeds: [ embed ], components });
            },
            // Autocomplete search has been broken since forever
            autocomplete: function(client, interaction) {
                if (interaction.options.get("nation").value.length > 0) {
                    const searchItems = client.nations.nations.reduce((value, nation, id) => { value.push({ id, name: nation.name, description: nation.description, shortDescription: nation.shortDescription }); return value; }, []);

                    const results = fuzzysort.go(interaction.options.get("nation").value, searchItems, { keys: ["id", "name", "description", "shortDescription"], limit: 25, threshold: -100 });

                    const response = [];
                    for (const result of results) response.push({ name: `[ ${result.obj.id} ] ${result.obj.name}`, value: Number(result.obj.id) });

                    interaction.respond(response);
                } else {
                    const response = [];
                    for (const nationId of client.nations.getNations(interaction.user.id)) response.push({ name: `[ ${nationId} ] ${client.nations.nations.get(nationId).name}`, value: nationId });
                    interaction.respond(response);
                }
            }
        }
    ]
}