// This is sometimes necessary for no reason at all
module.exports.main = function(client) {
    client.on("ready", () => {
        client.guilds.cache.forEach(guild => guild.shardId = 0)
    });
}