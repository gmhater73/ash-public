// Ash Public
// @.fuckme
// * Provided for your convenience. Manual linking uses client.stormworks.verify : see stormworksLink.js.

module.exports = {
    name: "forcelink",
    description: "Force link user",
    usage: "forcelink [Discord ID] [Steam64 ID]",
    category: "Stormworks",
    supportOnly: true,
    argsRequired: true,
    async execute(client, message, args) {
        const discordId = args[0];
        
        const steamId = args[1];
        if (steamId === null) return message.channel.send("Missing Steam ID");
        if (steamId.length !== 17) return message.channel.send(`Command error; run \`${client.config.prefix}help forcelink\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 1, "Steam ID is not Steam64")}`);

        await client.stormworks.verify(discordId, steamId);

        message.channel.send(":white_check_mark: OK");
    }
}