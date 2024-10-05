// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

module.exports = {
    name: "ping",
    description: "Returns latency information.",
    category: "System",
    usage: "ping",
    async execute(client, message) {
        const pingMessage = await message.channel.send(`${client.config.emojis.loading2} Ping?`);
        let content = `Pong! \`${pingMessage.createdTimestamp - message.createdTimestamp}ms\`. API Latency: \`${Math.round(client.ws.ping)}ms\`.\n`;
        //for (const server of client.stormworks.servers.filter(server => server.online)) content += `\nAsh => Server ${server.interface.id}: \`${server.latency}ms\``;
        pingMessage.edit(content);
    }
}