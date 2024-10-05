const { ActivityType } = require("discord.js");
const moment = require("moment"); require("moment-duration-format");

module.exports.main = function(client) {
    client.on("ready", () => {
        setInterval(() => {
            client.user.setPresence({ activities: [ { type: ActivityType.Watching, name: `for ${client.config.prefix}help | RAM Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB | Uptime: ${moment.duration(client.uptime).format(" D [days], H [hrs], m [mins], s [secs]")}` } ] });
        }, 10000);
    });
}