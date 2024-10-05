// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "fastpay",
    description: "Gives the provided user (or account number) the amount of money provided. Your primary account is used to pay if a source account is not provided.\n**This command bypasses two-step confirmation.\nOnly use it if you are absolutely sure that you are paying the right person.**",
    usage: "fastpay [target user/account] [money] <OPTIONAL source account> <.>", // pass all or * as money argument to quickly pay all; p/*/./personal to target account for personal account; fourth arg . = allow negative balance? (admin only)
    category: "Economy",
    aliases: ["fpay", "payf"],
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

        if (isNaN(moneyAmount)) return message.channel.send(`Command error; run \`${client.config.prefix}help pay\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 1, "Expected positive whole number: amount of money to transfer")}`);

        // tax calculation
        const moneyAmountWithTaxes = client.economy.calculateTransactionTaxes(moneyAmount, source, target).reduce((value, tax) => value + tax.amount, moneyAmount);

        if (source.balance < moneyAmount && !(args[3] === "." && client.config.staff.admins.includes(message.author.id))) {
            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setAuthor({ name: "Transaction Failed", iconURL: message.author.avatarURL() });
            embed.setDescription(`The transaction failed because source account #${source.id} does not have enough money.`);
            embed.addFields({ name: `:outbox_tray: [ ${source.id} ] ${source.name}`, value: `Owner: ${source.formattedOwner}\nBalance: ${source.balance.toLocaleString()} ${client.config.economy.moneySymbol}\n**An extra ${(moneyAmountWithTaxes - source.balance).toLocaleString()} ${client.config.economy.moneySymbol} is needed to complete the transaction.**` });
            embed.setFooter({ text: "Ash Economy | Requested by " + message.member.displayName });
            return message.channel.send({ embeds: [ embed ]});
        }

        const embed = new EmbedBuilder();
        embed.setColor("#32a852");
        embed.setAuthor({ name: "Money Transferred", iconURL: message.author.avatarURL() });
        embed.setDescription(`${moneyAmount.toLocaleString()} ${client.config.economy.moneySymbol} has been transferred from account #${source.id} to account #${target.id}`);

        // tax calculation
        const taxes = client.economy.calculateTransactionTaxes(moneyAmount, source, target);
        let taxInformation = "";
        if (taxes.length > 0) {
            for (const tax of taxes) {
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

        source.addHistory(`📤 <@${message.author.id}> transferred ${moneyAmountWithTaxes.toLocaleString()} ${client.config.economy.moneySymbol} to account #${target.id}`);
        target.addHistory(`📥 Received ${moneyAmount.toLocaleString()} ${client.config.economy.moneySymbol} from account #${source.id}`);

        embed.addFields(
            { name: `:outbox_tray: [ ${source.id} ] ${source.name}`, value: `Owner: ${source.formattedOwner}\nBalance: ${source.balance.toLocaleString()} ${client.config.economy.moneySymbol}` },
            { name: `:inbox_tray: [ ${target.id} ] ${target.name}`, value: `Owner: ${target.formattedOwner}\nBalance: ${target.balance.toLocaleString()} ${client.config.economy.moneySymbol}` }
        );

        if (taxes.length > 0) embed.addFields({ name: "Taxes", value: taxInformation });

        embed.setFooter({ text: `Ash Economy | Transferred by ${message.member.displayName}` });
        message.channel.send({ embeds: [ embed ] });
    }
}