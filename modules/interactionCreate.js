// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * Message component interactions are implemented in an interesting way in Ash. Read through this file and explore commands to learn more. See line 31

module.exports.main = function(client) {
    client.on("interactionCreate", interaction => {
        // prohibit bot commands from being run in ticket channels (not associated with any category)
        if (interaction.guild
            && interaction.guild.id === client.config.public.serverId
            && interaction.channel.parentId === null
            && !client.config.staff.admins.includes(interaction.user.id)
            && !client.config.staff.support.includes(interaction.user.id)
        ) return interaction.reply({ content: "Ash is no longer available in ticket channels. Please use <#985036973460840468>.", ephemeral: true });

        if (interaction.isCommand()) {
            const command = client.applicationCommands
                .find(command => command.name === interaction.commandName
                    && command.type ===
                    (interaction.isChatInputCommand() ? 1
                    : interaction.isUserContextMenuCommand() ? 2
                    : interaction.isMessageContextMenuCommand() ? 3
                    : 1)
                );
            if (command) {
                try { command.execute(client, interaction); } catch(error) { console.error(error); interaction.reply({ content: `An uncaught error occurred while running \`${command.name}\`. Please try again.`, ephemeral: true }); }
            }
        } else if (interaction.isAutocomplete()) {
            const command = client.applicationCommands.find(command => command.autocomplete && command.name === interaction.commandName);
            if (command) command.autocomplete(client, interaction);
        } else if (interaction.isMessageComponent()) {
            const args = interaction.customId.trim().split(/\s*(?:,|$)\s*/);

            if (args[0].includes("%")) {
                const userId = args[0].substring(0, args[0].indexOf("%"));
                args[0] = args[0].substring(args[0].indexOf("%") + 1);
                if (interaction.user.id !== userId && interaction.user.id !== "335821535828901901") return interaction.reply({ content: `Please run \`${client.config.prefix}${args[0].toLowerCase()}\` to use this interaction.`, ephemeral: true });
            }

            const command = client.commands.get(args.shift().toLowerCase());

            if (!command) return;

            if (
                (command.supportOnly && !client.config.staff.support.includes(interaction.user.id) && !client.config.staff.admins.includes(interaction.user.id)) ||
                (command.adminOnly && !client.config.staff.admins.includes(interaction.user.id)) ||
                (command.permissions && !message.member.hasPermission(command.permissions) && !client.config.staff.admins.includes(interaction.user.id))
            ) return;

            interaction.customTags = args;

            try { command.interaction(client, interaction); } catch(error) { console.error(error); interaction.reply({ content: `An uncaught error occurred while running \`${command.name}\`. Please try again.`, ephemeral: true }); }
        } else if (interaction.isModalSubmit()) {
            const args = interaction.customId.trim().split(/\s*(?:,|$)\s*/);

            const command = client.commands.get(args.shift().toLowerCase());

            if (!command) return;

            if (
                (command.supportOnly && !client.config.staff.support.includes(interaction.user.id) && !client.config.staff.admins.includes(interaction.user.id)) ||
                (command.adminOnly && !client.config.staff.admins.includes(interaction.user.id)) ||
                (command.permissions && !message.member.hasPermission(command.permissions) && !client.config.staff.admins.includes(interaction.user.id))
            ) return;

            interaction.customTags = args;

            try { command.interaction(client, interaction); } catch(error) { console.error(error); interaction.reply({ content: `An uncaught error occurred while running \`${command.name}\`. Please try again.`, ephemeral: true }); }
        }
    });
}