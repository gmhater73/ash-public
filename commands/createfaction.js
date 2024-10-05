// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * Please change the constants below to different values.

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const FACTION_CREATION_FEE = 350;
const FACTION_CREATION_FEE_ACCOUNT_ID = 2;

module.exports = {
    name: "createfaction",
    description: "Begin guided setup for faction creation.",
    category: "Factions",
    usage: "createfaction",
    aliases: ["cf"],
    supportOnly: true,
    async execute(client, message) {
        let data = {
            name: "",
            description: "",
            shortDescription: "",
            color: "",
            displayImage: "",
            nationId: null,
            owner: "",
            economyAccounts: 0
        }

        let embed = new EmbedBuilder();
        embed.setTitle("Faction Creation");
        embed.setDescription(`${client.config.emojis.loading2} Getting faction creation ready, please wait`);
        embed.setThumbnail(client.user.avatarURL());
        embed.setFooter({ text: `Ash Factions | Requested by ${message.member.displayName}` });
        await message.channel.send({ embeds: [embed] });

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Name
        embed.setTitle("(1/8) Faction Creation: Name");
        embed.setDescription("Please enter a **name** for the faction you are creating\nMax 64 characters\n\nType \`cancel\` to cancel\n\nModifying \`name\`");
        message.channel.send({ embeds: [embed] });

        let result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && newMessage.content.length <= 64, max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Faction creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Faction creation canceled.");

        data.name = result.content;
        result.reply(`:white_check_mark: Faction name set: \`${data.name}\``);

        // Description
        embed.setTitle("(2/8) Faction Creation: Description");
        embed.setDescription("Please enter a **description** for the faction you are creating\nMax 800 characters, multiline and formatting supported\n\nType \`cancel\` to cancel\n\nModifying \`description\`");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && newMessage.content.length <= 800, max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Faction creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Faction creation canceled.");

        data.description = result.content;
        result.reply(`:white_check_mark: Faction description set:\`\`\`md\n${data.description}\`\`\``);

        // Short Description
        embed.setTitle("(3/8) Faction Creation: Short Description");
        embed.setDescription("Please enter a **short description** for the faction you are creating\nMax 100 characters\n\nType \`cancel\` to cancel\n\nModifying \`shortDescription\`");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && newMessage.content.length <= 100, max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Faction creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Faction creation canceled.");

        data.shortDescription = result.content;
        result.reply(`:white_check_mark: Faction short description set: \`${data.shortDescription}\``);

        // Color
        embed.setTitle("(4/8) Faction Creation: Color");
        embed.setDescription("Please enter a **color** for the faction you are creating\nFaction color must be in hexadecimal format: \`#ffffff\`\n[Color picker](https://mdn.github.io/css-examples/tools/color-picker/)\n\nType \`cancel\` to cancel\n\nModifying \`color\`");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && (newMessage.content.toLowerCase() === "cancel" || /^#[0-9A-F]{6}$/i.test(newMessage.content)), max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Faction creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Faction creation canceled.");

        data.color = result.content.toLowerCase();
        result.reply(`:white_check_mark: Faction color set: \`${data.color}\``);

        // Display Image
        embed.setTitle("(5/8) Faction Creation: Display Image");
        embed.setDescription("Please upload or link a **display image** for the faction you are creating\n\nType \`cancel\` to cancel\n\nModifying \`displayImage\`");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && (newMessage.content.toLowerCase() === "cancel" || newMessage.content.includes("https://") || (newMessage.attachments.size > 0 && newMessage.attachments.first().contentType.includes("image"))), max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Faction creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Faction creation canceled.");

        data.displayImage = result.content.includes("https://") ? result.content : result.attachments.first().url;
        result.reply(`:white_check_mark: Faction display image set: ${data.displayImage}`);

        // Display Image
        embed.setTitle("(6/8) Faction Creation: Nation");
        embed.setDescription("Please enter the ID of the **nation** that the faction you are creating will be associated under\nYou may view nation ID using !nations - it is located at the bottom of the embed\n\nType \`cancel\` to cancel\n\nModifying \`nationId\`");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && (newMessage.content.toLowerCase() === "cancel" || client.nations.getNation(newMessage.content) || newMessage.content === "0"), max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Faction creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Faction creation canceled.");

        data.nationId = Number(result.content);
        if (data.nationId === 0) {
            result.reply(":white_check_mark: Faction nation set: None");
        } else result.reply(`:white_check_mark: Faction nation set: ${client.nations.getNation(data.nationId).emoji} ${client.nations.getNation(data.nationId).name}`);

        // Owner
        embed.setTitle("(7/8) Faction Creation: Owner");
        embed.setDescription("Please mention or provide the ID of the owner of the faction you are creating\n\nType \`cancel\` to cancel\n\nModifying \`owner\`");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id, max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Faction creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Faction creation canceled.");

        const user = await client.getTargetUser(result, result.content);
        if (!user) return result.reply("Invalid user.");
        if (!client.stormworks.players.getSteamIdFromDiscordId(user.id)) return result.reply("User not verified.");

        data.owner = user.id;
        result.reply(`:white_check_mark: Faction owner set: <@${user.id}>`);

        // Economy Accounts
        embed.setTitle("(8/8) Faction Creation: Economy Accounts");
        embed.setDescription("Please enter the number of economy accounts that should be created for this faction\nMust be a number 0-5\n\nType \`cancel\` to cancel");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && (newMessage.content.toLowerCase() === "cancel" || (Number(newMessage.content) >= 0 && Number(newMessage.content) <= 5)), max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Faction creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Faction creation canceled.");

        data.economyAccounts = Number(result.content);
        result.reply(`:white_check_mark: Creating \`${result.content}\` economy accounts`);

        // Deduct fee?
        const primaryAccount = client.economy.getPrimaryAccount(user.id);
        if (!primaryAccount) return message.channel.send("Faction creation error (primaryAccount not exists): contact developer");

        embed.setTitle("Faction Creation: Deduct fee?");
        embed.setDescription(`Would you like to deduct the faction registration fee of \`${FACTION_CREATION_FEE.toLocaleString()} ${client.config.economy.moneySymbol}\` from user's primary account \`#${primaryAccount.id}\` \`${primaryAccount.name}\`?\nType \`yes\` or \`no\`\n\n${primaryAccount.balance.toLocaleString()} ${client.config.economy.moneySymbol} --> ${(primaryAccount.balance - FACTION_CREATION_FEE).toLocaleString()} ${client.config.economy.moneySymbol}\n\nType \`cancel\` to cancel`);
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && (newMessage.content.toLowerCase() === "cancel" || newMessage.content.toLowerCase().startsWith("y") || newMessage.content.toLowerCase().startsWith("n")), max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Faction creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Faction creation canceled.");

        if (result.content.toLowerCase().startsWith("y")) {
            const factionCreationFeeAccount = client.economy.getAccount(FACTION_CREATION_FEE_ACCOUNT_ID);
            if (!factionCreationFeeAccount) return result.reply("Faction creation error (factionCreationFeeAccount not exists): contact developer");

            primaryAccount.balance -= FACTION_CREATION_FEE;
            primaryAccount.addHistory(`📤 Faction registration fee deducted: ${FACTION_CREATION_FEE.toLocaleString()} ${client.config.economy.moneySymbol}`);

            factionCreationFeeAccount.balance += FACTION_CREATION_FEE;
            factionCreationFeeAccount.addHistory(`Registered ${data.name} • ${FACTION_CREATION_FEE.toLocaleString()} ${client.config.economy.moneySymbol} #${primaryAccount.id}`);

            result.reply(`:white_check_mark: Charged \`${FACTION_CREATION_FEE.toLocaleString()} ${client.config.economy.moneySymbol}\` registration fee. Final balance \`${primaryAccount.balance} ${client.config.economy.moneySymbol}\``);
        }

        if (result.content.toLowerCase().startsWith("n")) result.reply(":white_check_mark: Fee not charged");

        // Create faction
        const msg = await message.channel.send(`${client.config.emojis.loading} Creating faction; please wait`); let time = performance.now();

        const faction = client.factions.createFaction(data.name);
        faction.description = data.description;
        faction.shortDescription = data.shortDescription;
        faction.color = data.color;
        faction.displayImage = data.displayImage;
        faction.nationId = data.nationId;
        faction.addMember(data.owner).rankId = "4";
        faction.ownerId = data.owner;
        for (let i = 0; i < data.economyAccounts; i++) client.economy.createAccount(i === 0 ? `${faction.name} Funds` : `Account ${i + 1}`, 0, 1).ownerId = faction.id;

        time = Math.floor(performance.now() - time);

        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%faction, selectFaction, ${faction.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("View")
        );

        msg.edit({ content: `:white_check_mark: Created faction \`#${faction.id}\`: \`${faction.name}\` in ${time} ms`, components: [actionRow] });
    }
}