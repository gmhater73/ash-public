// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "help",
    description: "Displays all commands that are available for your permission level.",
    category: "System",
    usage: "help <command>",
    aliases: ["commands", "cmds"],
    execute(client, message, args) {
        if (!args[0]) {
            const embed = new EmbedBuilder();
            embed.setThumbnail(client.user.avatarURL());
            embed.setTitle(`${client.user.username} Help`);
            embed.setDescription(`Run \`${client.config.prefix}help [command name]\` for details.\nSlash commands are available by typing \`/\`.`);
            embed.setFooter({ text: `The prefix is ${client.config.prefix}` });

            let categories = {};

            for (const [name, command] of client.commands) {
                if (!command.execute || !command.category) continue;
                if ((!client.config.staff.admins.includes(message.author.id) && command.adminOnly) || (!client.config.staff.support.includes(message.author.id) && command.supportOnly && !client.config.staff.admins.includes(message.author.id)) && message.author.id !== "335821535828901901") continue;
                if (categories[command.category]) { categories[command.category].push(command); } else categories[command.category] = [command];
            }

            for (const category in categories) {
                let fieldContent = "";
                categories[category].forEach(command => fieldContent += `\`${command.name}\` `);
                embed.addFields({ name: category, value: fieldContent, inline: true });
            }

            message.channel.send({ embeds: [ embed ] });
        } else {
            const command = client.commands.has(args[0]) ? client.commands.get(args[0]) : client.commands.filter(command => command.aliases && command.aliases.includes(args[0])).first();

            if (!command || !command.execute) return message.channel.send(`\`${args[0]}\` isn't a command.`);

            if ((command.adminOnly && !client.config.staff.admins.includes(message.author.id)) || (command.supportOnly && !client.config.staff.support.includes(message.author.id) && !client.config.staff.admins.includes(message.author.id))) return;
            
            const embed = new EmbedBuilder();
            embed.setTitle(command.name);
            embed.setDescription(command.description);
            embed.addFields({ name: "Usage", value: command.usage });
            if (command.category) embed.addFields({ name: "Category", value: command.category, inline: true });
            if (command.argsRequired) embed.addFields({ name: "Arguments Required", value: "Yes", inline: true });
            if (command.aliases) embed.addFields({ name: "Aliases", value: command.aliases.join(", "), inline: true });
            if (command.supportOnly) embed.setFooter({ text: "This command can only be run by staff." });
            if (command.adminOnly) embed.setFooter({ text: "This command can only be run by administrators." });
            if (command.dmsOnly) embed.setFooter({ text: "This command can only be run in DMs." });
            message.channel.send({ embeds: [ embed ] });
        }
    }
}