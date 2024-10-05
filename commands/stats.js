// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { EmbedBuilder, version } = require("discord.js");
const moment = require("moment"); require("moment-duration-format");

module.exports = {
    name: "stats",
    description: "Returns various statistics and information about the bot.",
    category: "System",
    usage: "stats",
    aliases: ["stat"],
    async execute(client, message) {
        const embed = new EmbedBuilder();
        embed.setAuthor({ name: `${client.user.username} Stats`, iconURL: client.user.avatarURL() });
        embed.addFields(
            { name: "Memory Usage", value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
            { name: "Process Uptime", value: moment.duration(client.uptime).format(" D [days], H [hrs], m [mins], s [secs]"), inline: true },
            { name: "Node.js / discord.js", value: `${process.version} / ${version}`, inline: true },
            { name: "Cached Users", value: client.users.cache.size.toLocaleString(), inline: true },
            { name: "Cached Guilds", value: client.guilds.cache.size.toLocaleString(), inline: true },
            { name: "Cached Channels", value: client.channels.cache.size.toLocaleString(), inline: true },
        );
        embed.setFooter({ text: "@.fuckme" });
        message.channel.send({ embeds: [ embed ] });
    }
}