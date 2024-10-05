// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * It is recommended to restart the bot instead of using this command.

module.exports = {
    name: "reload",
    description: "Reloads a command into memory.",
    usage: "reload [command name]",
    category: "System",
    argsRequired: true,
    adminOnly: true,
    async execute(client, message, args) {
        const msg = await message.channel.send(`${client.config.emojis.loading} Please wait.`); const time = performance.now();
        try {
            client.log("bgGreen", "RELOAD", `[commands/reload.js]: Reloading command ${args[0]}.js.`);
            delete require.cache[require.resolve(`./${args[0]}.js`)];
            const file = require(`./${args[0]}.js`);
            client.commands.set(file.name, file);
            client.applicationCommands = Array.from(client.commands.values()).filter(command => command.applicationCommands).flatMap(command => command.applicationCommands);
            return msg.edit(`Loaded \`${args[0]}\`. Took \`${(performance.now() - time).toFixed(2)} ms\`.`)
        } catch(error) {
            client.log("bgRed", "ERROR", `[commands/reload.js]: ${error.stack}`);
            return msg.edit(`An error occured. The command \`${args[0]}\` may not exist.`);
        }
    }
}