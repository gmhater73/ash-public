// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * Please change the constants below to different values.

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const NATION_CREATION_FEE = 5000;
const NATION_CREATION_FEE_ACCOUNT_ID = 1;

module.exports = {
    name: "createnation",
    description: "Begin guided setup for nation creation.",
    category: "Nations",
    usage: "createnation",
    aliases: ["cn"],
    supportOnly: true,
    async execute(client, message) {
        let data = {
            name: "",
            description: "",
            shortDescription: "",
            color: "",
            emoji: "",
            displayImage: "",
            owner: "",
            economyAccounts: 0
        }

        let embed = new EmbedBuilder();
        embed.setTitle("Nation Creation");
        embed.setDescription(`${client.config.emojis.loading2} Getting nation creation ready, please wait`);
        embed.setThumbnail(client.user.avatarURL());
        embed.setFooter({ text: `Ash Nations | Requested by ${message.member.displayName}` });
        await message.channel.send({ embeds: [embed] });

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Name
        embed.setTitle("(1/8) Nation Creation: Name");
        embed.setDescription("Please enter a **name** for the nation you are creating\nMax 64 characters\n\nType \`cancel\` to cancel\n\nModifying \`name\`");
        message.channel.send({ embeds: [embed] });

        let result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && newMessage.content.length <= 64, max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Nation creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Nation creation canceled.");

        data.name = result.content;
        result.reply(`:white_check_mark: Nation name set: \`${data.name}\``);

        // Description
        embed.setTitle("(2/8) Nation Creation: Description");
        embed.setDescription("Please enter a **description** for the nation you are creating\nMax 800 characters, multiline and formatting supported\n\nType \`cancel\` to cancel\n\nModifying \`description\`");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && newMessage.content.length <= 800, max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Nation creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Nation creation canceled.");

        data.description = result.content;
        result.reply(`:white_check_mark: Nation description set:\`\`\`md\n${data.description}\`\`\``);

        // Short Description
        embed.setTitle("(3/8) Nation Creation: Short Description");
        embed.setDescription("Please enter a **short description** for the nation you are creating\nMax 100 characters\n\nType \`cancel\` to cancel\n\nModifying \`shortDescription\`");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && newMessage.content.length <= 100, max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Nation creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Nation creation canceled.");

        data.shortDescription = result.content;
        result.reply(`:white_check_mark: Nation short description set: \`${data.shortDescription}\``);

        // Color
        embed.setTitle("(4/8) Nation Creation: Color");
        embed.setDescription("Please enter a **color** for the nation you are creating\nNation color must be in hexadecimal format: \`#ffffff\`\n[Color picker](https://mdn.github.io/css-examples/tools/color-picker/)\n\nType \`cancel\` to cancel\n\nModifying \`color\`");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && (newMessage.content.toLowerCase() === "cancel" || /^#[0-9A-F]{6}$/i.test(newMessage.content)), max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Nation creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Nation creation canceled.");

        data.color = result.content.toLowerCase();
        result.reply(`:white_check_mark: Nation color set: \`${data.color}\``);

        // Color
        embed.setTitle("(5/8) Nation Creation: Emoji");
        embed.setDescription("Please enter the **emoji** for the nation you are creating\nDo not upload an image. Upload the emoji to Discord, then send the emoji here.\n\nType \`cancel\` to cancel\n\nModifying \`emoji\`");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id, max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Nation creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Nation creation canceled.");

        data.emoji = result.content;
        result.reply(`:white_check_mark: Nation emoji set: \`${data.emoji}\``);

        // Display Image
        embed.setTitle("(6/8) Nation Creation: Display Image");
        embed.setDescription("Please upload or link a **display image** for the nation you are creating\n\nType \`cancel\` to cancel\n\nModifying \`displayImage\`");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && (newMessage.content.toLowerCase() === "cancel" || newMessage.content.includes("https://") || (newMessage.attachments.size > 0 && newMessage.attachments.first().contentType.includes("image"))), max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Nation creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Nation creation canceled.");

        data.displayImage = result.content.includes("https://") ? result.content : result.attachments.first().url;
        result.reply(`:white_check_mark: Nation display image set: ${data.displayImage}`);

        // Owner
        embed.setTitle("(7/8) Nation Creation: Owner");
        embed.setDescription("Please mention or provide the ID of the owner of the nation you are creating\n\nType \`cancel\` to cancel\n\nModifying \`owner\`");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id, max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Nation creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Nation creation canceled.");

        const user = await client.getTargetUser(result, result.content);
        if (!user) return result.reply("Invalid user.");
        if (!client.stormworks.players.getSteamIdFromDiscordId(user.id)) return result.reply("User not verified.");

        data.owner = user.id;
        result.reply(`:white_check_mark: Nation owner set: <@${user.id}>`);

        // Economy Accounts
        embed.setTitle("(8/8) Nation Creation: Economy Accounts");
        embed.setDescription("Please enter the number of economy accounts that should be created for this nation\nMust be a number 0-5\n\nType \`cancel\` to cancel");
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && (newMessage.content.toLowerCase() === "cancel" || (Number(newMessage.content) >= 0 && Number(newMessage.content) <= 5)), max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Nation creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Nation creation canceled.");

        data.economyAccounts = Number(result.content);
        result.reply(`:white_check_mark: Creating \`${result.content}\` economy accounts`);

        // Deduct fee?
        const primaryAccount = client.economy.getPrimaryAccount(user.id);
        if (!primaryAccount) return message.channel.send("Nation creation error (primaryAccount not exists): contact developer");

        embed.setTitle("Nation Creation: Deduct fee?");
        embed.setDescription(`Would you like to deduct the nation registration fee of \`${NATION_CREATION_FEE.toLocaleString()} ${client.config.economy.moneySymbol}\` from user's primary account \`#${primaryAccount.id}\` \`${primaryAccount.name}\`?\nType \`yes\` or \`no\`\n\n${primaryAccount.balance.toLocaleString()} ${client.config.economy.moneySymbol} --> ${(primaryAccount.balance - NATION_CREATION_FEE).toLocaleString()} ${client.config.economy.moneySymbol}\n\nType \`cancel\` to cancel`);
        message.channel.send({ embeds: [embed] });

        result = await message.channel.awaitMessages({ filter: newMessage => newMessage.author.id === message.author.id && (newMessage.content.toLowerCase() === "cancel" || newMessage.content.toLowerCase().startsWith("y") || newMessage.content.toLowerCase().startsWith("n")), max: 1, time: 300000, errors: ["time"] })
            .catch(() => message.channel.send(":x: Nation creation timed out."));
        if (!result.first()) return;
        result = result.first();

        if (result.content.toLowerCase() === "cancel") return result.reply("Nation creation canceled.");

        if (result.content.toLowerCase().startsWith("y")) {
            const nationCreationFeeAccount = client.economy.getAccount(NATION_CREATION_FEE_ACCOUNT_ID);
            if (!nationCreationFeeAccount) return result.reply("Nation creation error (nationCreationFeeAccount not exists): contact developer");

            primaryAccount.balance -= NATION_CREATION_FEE;
            primaryAccount.addHistory(`📤 Nation registration fee deducted: ${NATION_CREATION_FEE.toLocaleString()} ${client.config.economy.moneySymbol}`);

            nationCreationFeeAccount.balance += NATION_CREATION_FEE;
            nationCreationFeeAccount.addHistory(`Registered ${data.name} • ${NATION_CREATION_FEE.toLocaleString()} ${client.config.economy.moneySymbol} #${primaryAccount.id}`);

            result.reply(`:white_check_mark: Charged \`${NATION_CREATION_FEE.toLocaleString()} ${client.config.economy.moneySymbol}\` registration fee. Final balance \`${primaryAccount.balance} ${client.config.economy.moneySymbol}\``);
        }

        if (result.content.toLowerCase().startsWith("n")) result.reply(":white_check_mark: Fee not charged");

        // Create nation
        const msg = await message.channel.send(`${client.config.emojis.loading} Creating nation; please wait`); let time = performance.now();

        const nation = client.nations.createNation(data.name);
        nation.description = data.description;
        nation.shortDescription = data.shortDescription;
        nation.color = data.color;
        nation.emoji = data.emoji;
        nation.displayImage = data.displayImage;
        nation.addMember(data.owner).rankId = "4";
        nation.ownerId = data.owner;
        for (let i = 0; i < data.economyAccounts; i++) client.economy.createAccount(i === 0 ? `${nation.name} Treasury` : `Account ${i + 1}`, 0, 2).ownerId = nation.id;

        time = Math.floor(performance.now() - time);

        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%nation, selectNation, ${nation.id}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("View")
        );

        msg.edit({ content: `:white_check_mark: Created nation \`#${nation.id}\`: \`${nation.name}\` in ${time} ms`, components: [actionRow] });
    }
}