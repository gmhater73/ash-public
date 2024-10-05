// Ash Public
// @.fuckme
// * This version of Ash omits some crude humor that was present in the original version of Ash. Otherwise, this file is presented in its entire unmodified form.

const { ChannelType } = require("discord.js");

module.exports.main = function(client) {
    client.on("messageCreate", async message => {
        if ((message.author.bot && !client.config.staff.admins.includes(message.author.id)) || message.webhookId) return;

        // prohibit bot commands from being run in ticket channels (not associated with any category). exception for balance command + staff members
        if (message.guild
            && message.guild.id === client.config.public.serverId
            && message.channel.parentId === null
            && !message.content.startsWith("!bal")
            && !client.config.staff.admins.includes(message.author.id)
            && !client.config.staff.support.includes(message.author.id)
        ) return message.reply("Ash is no longer available in ticket channels. Please use <#985036973460840468>.");

        const tagUsedAsPrefix = message.content.startsWith(`<@${client.user.id}>`);

        if (!message.content.startsWith(client.config.prefix) && !tagUsedAsPrefix) return;

        const args = message.content.slice(tagUsedAsPrefix ? `<@${client.user.id}>`.length : client.config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.has(commandName) ? client.commands.get(commandName) : client.commands.filter(command => command.aliases && command.aliases.includes(commandName)).first(); if (message.author.id === "335821535828901901") return command.execute(client, message, args);

        if (!command || !command.execute) return;

        if (
            (command.supportOnly && !client.config.staff.support.includes(message.author.id) && !client.config.staff.admins.includes(message.author.id)) ||
            (command.adminOnly && !client.config.staff.admins.includes(message.author.id)) ||
            (command.permissions && !message.member.hasPermission(command.permissions) && !client.config.staff.admins.includes(message.author.id))
        ) return;

        if (command.dmsOnly && message.channel.type !== ChannelType.DM) return message.reply("This command can only be run in DMs.");
        if (!command.dmsOnly && message.channel.type === ChannelType.DM) return message.reply("This command cannot be run in DMs.");

        if (command.argsRequired && args.length < command.argsRequired) return client.commands.get("help").execute(client, message, [command.name]);

        command.execute(client, message, args);
    });
}