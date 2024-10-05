// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "pay",
    description: "Gives the provided user (or account number) the amount of money provided. Your primary account is used to pay if a source account is not provided.",
    usage: "pay [target user/account] [money] <OPTIONAL source account>", // pass all or * as money argument to quickly pay all; p/*/./personal to target account for personal account
    category: "Economy",
    argsRequired: true,
    async execute(client, message, args) {
        if (!client.stormworks.players.getSteamIdFromDiscordId(message.author.id)) {
            const embed = new EmbedBuilder();
            embed.setTitle("Not Linked");
            embed.setDescription(`You must link your account to Stormworks before you can use Ash Economy.\n\nTo link your account, run \`${client.config.prefix}link\`.`);
            return message.channel.send({ embeds: [ embed ] });
        }

        if (!args[1]) return message.channel.send("You must provide the amount of money to transfer.");

        let moneyAmount = parseInt(args[1], 10);
        if (args[1] === "all" || args[1] === "*" || args[1] === ".") { moneyAmount = -1; }
        else if (isNaN(moneyAmount) || moneyAmount < 0) return message.channel.send(`Command error; run \`${client.config.prefix}help pay\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 1, "Expected positive whole number: amount of money to transfer")}`);

        let target = await client.getTargetUser(message, args[0]);
        if (target) {
            if (target.user.bot) return message.channel.send(`Command error; run \`${client.config.prefix}help pay\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 0, "Target user is a bot (LOL!)")}`);
            if (!client.stormworks.players.getSteamIdFromDiscordId(target.id)) {
                const embed = new EmbedBuilder();
                embed.setTitle("Not Linked");
                embed.setDescription(`Target user cannot use Ash Economy because they are not linked.\n\nThey must run \`${client.config.prefix}link\` to link their account.`);
                return message.channel.send({ embeds: [ embed ] });
            }
            target = client.economy.getPrimaryAccount(target.id);
        } else target = (args[0].toLowerCase() === "p" || args[0] === "*" || args[0] === "." || args[0].toLowerCase() === "personal") ? client.economy.getPrimaryAccount(message.author.id) : client.economy.getAccount(args[0]);
        if (!target) return message.channel.send(`Command error; run \`${client.config.prefix}help pay\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 0, "Target account was not found")}`);

        let source = args[2] !== undefined ? client.economy.getAccount(args[2]) : client.economy.getPrimaryAccount(message.author.id);
        if (!source) return message.channel.send(`Command error; run \`${client.config.prefix}help pay\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 2, "Source account was not found")}`);
        if (!source.hasPermission(message.author.id, client.economy.enums.permissions("UseAccount"))) return message.channel.send(`You do not have Use permissions on source account #${source.id}.`);

        if (moneyAmount === -1) moneyAmount = (source.balance - client.economy.calculateTransactionTaxes(source.balance, source, target).reduce((value, tax) => value + tax.amount, 0));
        moneyAmount = Math.max(moneyAmount, 0);

        // tax calculation
        const taxes = client.economy.calculateTransactionTaxes(moneyAmount, source, target);
        let moneyAmountWithTaxes = moneyAmount;
        let taxInformation = "";
        if (taxes.length > 0) {
            for (const tax of taxes) {
                moneyAmountWithTaxes += tax.amount;
                taxInformation += `**${tax.reason}**: ${tax.amount.toLocaleString()} ${client.config.economy.moneySymbol} (${tax.tax * 100}%) --> ${tax.to.formattedOwner}\n`;
            }
            taxInformation += `**Total: ${moneyAmountWithTaxes.toLocaleString()} ${client.config.economy.moneySymbol}**`;
        }

        if (source.balance < moneyAmountWithTaxes) {
            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setAuthor({ name: "Transaction Failed", iconURL: message.author.avatarURL() });
            embed.setDescription(`The transaction failed because source account #${source.id} does not have enough money.`);
            embed.addFields({ name: `:outbox_tray: [ ${source.id} ] ${source.name}`, value: `Owner: ${source.formattedOwner}\nBalance: ${source.balance.toLocaleString()} ${client.config.economy.moneySymbol}\n**An extra ${(moneyAmountWithTaxes - source.balance).toLocaleString()} ${client.config.economy.moneySymbol} is needed to complete the transaction.**` });
            if (taxes.length > 0) embed.addFields({ name: "Taxes", value: taxInformation });
            embed.setFooter({ text: "Ash Economy | Requested by " + message.member.displayName });
            return message.channel.send({ embeds: [ embed ]});
        }

        const embed = new EmbedBuilder();
        embed.setAuthor({ name: "Transfer Money", iconURL: message.author.avatarURL() });
        embed.setDescription(`Are you sure you would like to transfer ${moneyAmount.toLocaleString()} ${client.config.economy.moneySymbol} from account #${source.id} to account #${target.id}?`);

        embed.addFields(
            { name: `:outbox_tray: ${source.name}`, value: `\`#${source.id}\` owned by ${source.formattedOwner}\n${source.balance.toLocaleString()} ${client.config.economy.moneySymbol} --> **${source.id === target.id ? `${source.balance.toLocaleString()} ${client.config.economy.moneySymbol}` : `${(source.balance - moneyAmountWithTaxes).toLocaleString()} ${client.config.economy.moneySymbol}`}**` },
            { name: `:inbox_tray: ${target.name}`, value: `\`#${target.id}\` owned by ${target.formattedOwner}\n${target.balance.toLocaleString()} ${client.config.economy.moneySymbol} --> **${source.id === target.id ? `${target.balance.toLocaleString()} ${client.config.economy.moneySymbol}` : `${(target.balance + moneyAmount).toLocaleString()} ${client.config.economy.moneySymbol}`}**` }
        );

        if (taxes.length > 0) embed.addFields({ name: "Taxes", value: taxInformation });

        embed.setFooter({ text: "Ash Economy | Requested by " + message.member.displayName });

        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%pay, confirmPay, ${source.id}, ${target.id}, ${moneyAmount}`)
                .setStyle(ButtonStyle.Success)
                .setLabel("Yes")
                .setEmoji("✅"),
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%pay, cancelPay`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("No")
                .setEmoji("❌")
        );

        message.channel.send({ embeds: [ embed ], components: [ actionRow ] });
    },
    async interaction(client, interaction) {
        if (interaction.customTags[0] === "confirmPay") {
            const source = client.economy.getAccount(interaction.customTags[1]);
            if (!source) return interaction.reply({ content: `Source account #${interaction.customTags[1]} no longer exists.`, ephemeral: true });
            const target = client.economy.getAccount(interaction.customTags[2]);
            if (!target) return interaction.reply({ content: `Target account #${interaction.customTags[2]} no longer exists.`, ephemeral: true });
            if (!source.hasPermission(interaction.user.id, client.economy.enums.permissions("UseAccount"))) return interaction.reply({ content: `You do not have Use permissions on source account #${source.id}.`, ephemeral: true });
            const moneyAmount = Number(interaction.customTags[3]);
            if (isNaN(moneyAmount) || moneyAmount < 0) return interaction.reply({ content: `Transaction error. Please try again.`, ephemeral: true });
            if (source.balance < client.economy.calculateTransactionTaxes(moneyAmount, source, target).reduce((value, tax) => value + tax.amount, moneyAmount)) return interaction.reply({ content: `Source account #${source.id} no longer has enough money to complete the transaction.`, ephemeral: true });

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.green);
            embed.setAuthor({ name: "Money Transferred", iconURL: interaction.user.avatarURL() });
            embed.setDescription(`${moneyAmount.toLocaleString()} ${client.config.economy.moneySymbol} has been transferred from account #${source.id} to account #${target.id}`)

            // tax calculation
            const taxes = client.economy.calculateTransactionTaxes(moneyAmount, source, target);
            let moneyAmountWithTaxes = moneyAmount;
            let taxInformation = "";
            if (taxes.length > 0) {
                for (const tax of taxes) {
                    moneyAmountWithTaxes += tax.amount;
                    taxInformation += `**${tax.reason}**: ${tax.amount.toLocaleString()} ${client.config.economy.moneySymbol} (${tax.tax * 100}%) --> ${tax.to.formattedOwner}\n`;
                    if (tax.amount > 0) {
                        tax.to.balance += tax.amount;
                        tax.to.addHistory(`📥 Received ${tax.amount.toLocaleString()} ${client.config.economy.moneySymbol} from ${tax.reason} (${tax.tax * 100}%)`);
                    }
                }
                taxInformation += `**Total**: ${moneyAmountWithTaxes.toLocaleString()} ${client.config.economy.moneySymbol}`;
            }

            source.balance -= moneyAmountWithTaxes;
            target.balance += moneyAmount;

            source.addHistory(`📤 <@${interaction.user.id}> transferred ${moneyAmountWithTaxes.toLocaleString()} ${client.config.economy.moneySymbol} to account #${target.id}`);
            target.addHistory(`📥 Received ${moneyAmount.toLocaleString()} ${client.config.economy.moneySymbol} from account #${source.id}`);

            embed.addFields(
                { name: `:outbox_tray: [ ${source.id} ] ${source.name}`, value: `Owner: ${source.formattedOwner}\nBalance: ${source.balance.toLocaleString()} ${client.config.economy.moneySymbol}` },
                { name: `:inbox_tray: [ ${target.id} ] ${target.name}`, value: `Owner: ${target.formattedOwner}\nBalance: ${target.balance.toLocaleString()} ${client.config.economy.moneySymbol}` }
            );

            if (taxes.length > 0) embed.addFields({ name: "Taxes", value: taxInformation });

            embed.setFooter({ text: `Ash Economy | Transferred by ${interaction.member.displayName}` });
            interaction.message.edit({ embeds: [ embed ], components: [] });
        } else if (interaction.customTags[0] === "cancelPay") {
            const embed = new EmbedBuilder();
            embed.setDescription("Transaction was canceled.");
            embed.setFooter({ text: `Ash Economy | Requested by ${interaction.member.displayName}` });
            interaction.message.edit({ embeds: [ embed ], components: [] });
        }
    }
}