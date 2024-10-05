// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

module.exports = {
    name: "movefaction",
    description: "Assign faction nation ID or remove (0)",
    usage: "movefaction [faction ID] [nation ID / 0]",
    aliases: ["mf"],
    category: "Factions",
    supportOnly: true,
    argsRequired: true,
    execute(client, message, args) {
        const factionId = parseInt(args[0], 10);
        if (isNaN(factionId)) return message.channel.send(`Command error; run \`${client.config.prefix}help movefaction\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 0, "Faction ID is not a positive whole number")}`);

        const nationId = args[1] ? parseInt(args[1], 10) : null;
        if (nationId === null) return message.channel.send("Missing nation ID");
        if (isNaN(nationId)) return message.channel.send(`Command error; run \`${client.config.prefix}help movefaction\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 1, "Nation ID is not a positive whole number")}`);

        const faction = client.factions.getFaction(factionId);
        const nation = client.nations.getNation(nationId);

        if (!faction) return message.channel.send(`Command error; run \`${client.config.prefix}help movefaction\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 1, "Faction missing")}`);
        if (!nation && nationId !== 0) return message.channel.send(`Command error; run \`${client.config.prefix}help movefaction\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 1, "Nation missing")}`);

        message.channel.send(`:white_check_mark: OK \`${factionId}\` ${faction.name}: \`${faction.nationId}\` --> \`${nationId}\``);

        faction.nationId = nationId;
    }
}