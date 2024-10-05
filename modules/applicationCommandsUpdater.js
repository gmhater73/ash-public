// Ash Public
// @.fuckme
// * This module automatically registers and updates app commands based on the registered commands/*.js
// * This file is presented in its entire unmodified form.

const guilds = [];

const { ApplicationCommand } = require("discord.js");

module.exports.main = function(client) {
    guilds.push(client.config.public.serverId);
    client.on("ready", async function() {
        for (const guildId of guilds) {
            const guild = await client.guilds.fetch(guildId);
            const existingCommands = Array.from((await guild.commands.fetch()).values());
            for (const command of existingCommands) if (!client.applicationCommands.find(c => c.name === command.name)) { client.log("bgGreen", "APPCMDUPDATER", `Deleting ${command.name} for guild ${guild.name}`); command.delete(); }
            for (const command of client.applicationCommands) {
                const existingCommand = existingCommands.find(c => c.name === command.name);
                if (!existingCommand) {
                    client.log("bgGreen", "APPCMDUPDATER", `Registering command ${command.name} for guild ${guild.name}`);
                    guild.commands.create({
                        name: command.name,
                        description: command.description,
                        type: command.type,
                        options: command.options
                    });
                } else {
                    if (command.description && existingCommand.description !== command.description) {
                        client.log("bgGreen", "APPCMDUPDATER", `Updating description for ${command.name} for guild ${guild.name}`);
                        existingCommand.setDescription(command.description);
                    }
                    if (command.options && existingCommand.options && !ApplicationCommand.optionsEqual(existingCommand.options, command.options)) {
                        client.log("bgGreen", "APPCMDUPDATER", `Updating options for ${command.name} for guild ${guild.name}`);
                        existingCommand.setOptions(command.options);
                    }
                }
            }
        }
/*
        client.log("bgGreen", "SLASH", "Deleting existing commands.");
        for (const guildId of guilds) {
            const guild = await client.guilds.fetch(guildId);
            const existingCommands = await guild.commands.fetch();
            existingCommands.forEach(command => command.delete());
        }
        //const existingCommands = await client.application.commands.fetch();
        //existingCommands.forEach(command => command.delete());

        for (const command of client.applicationCommands) {
            client.log("bgGreen", "SLASH", `Deploying command ${command.name}.`);
            for (const guildId of guilds) {
                if (command.permissions && command.permissions[guildId]) {
                    const result = await client.application.commands.create({
                        name: command.name,
                        description: command.description,
                        type: command.type,
                        options: command.options,
                        defaultPermission: command.permissions[guildId].default !== undefined ? command.permissions[guildId].default : true,
                    }, guildId);
                    result.permissions.add({ permissions: command.permissions[guildId].permissions });
                } else {
                    client.application.commands.create({
                        name: command.name,
                        description: command.description,
                        type: command.type,
                        options: command.options
                    }, guildId);
                }
            }
            //client.application.commands.create({
            //    name: command.name,
            //    description: command.slashCommand.description,
            //    options: command.slashCommand.options
            //});
        }
        
        client.log("bgGreen", "SLASH", "Successfully deployed slash commands.");

        return "OK";*/
    });
}