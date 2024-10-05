// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const moment = require("moment");

const banReasons = new Map();

module.exports = {
    name: "swban",
    description: "Bans a user from in-game servers for specified amount of time. These bans are associated with the user's Discord ID and link data.\n\nTime should be formatted using integers and character code.\nFor example: 7w4d -> 7 weeks, 4 days",
    usage: "swban [user] [time y/M/w/d/h/m/s] <OPTIONAL reason>",
    aliases: ["ban"],
    category: "Moderation",
    supportOnly: true,
    argsRequired: true,
    async execute(client, message, args) {
        const user = await client.getTargetUser(message, args.shift());
        if (!user) return message.channel.send(`Command error; run \`${client.config.prefix}help swban\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 0, "Target user was not found")}`);
        if (user.user.bot) return message.channel.send(`Command error; run \`${client.config.prefix}help swban\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 0, "Target user is a bot (LOL!)")}`);

        if (!args[0]) return message.channel.send("Please provide the ban length.");
        const time = args.shift().toLowerCase().match(/(\d+[a-z]+)/g);

        const addTime = {}
        for (const string of time) {
            const key = string.replace(/[^a-z]/g, "");
            const int = parseInt(string.replace(/[^0-9]/g, ""));
            if (!addTime[key]) addTime[key] = 0;
            addTime[key] += isNaN(int) ? 0 : int;
        }

        const until = moment().add(addTime);
        if (until.valueOf() <= Date.now()) return message.channel.send(`Command error; run \`${client.config.prefix}help swban\` for proper syntax.${client.generateCommandErrorVisualization(message.content, 1, "Invalid ban length")}`);

        let reason = args.join(" ").trim();
        if (!reason || reason === "") reason = "Not provided";

        banReasons.set(user.id, reason);

        const existingBan = client.stormworks.players.getBan(user.id);

        const embed = new EmbedBuilder();
        embed.setColor(client.config.colors.red);
        embed.setTitle("Ban User");
        embed.setDescription(`Are you sure you would like to ban <@${user.id}> from in-game servers until <t:${until.unix()}>?\n\nReason: ${reason}${existingBan ? `\n\n:warning: **User has an existing ban until <t:${Math.floor(existingBan.until / 1000)}>.** This ban will be overwritten.` : ""}`);
        embed.setFooter({ text: `SWLink | Requested by ${message.member.displayName}` });

        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%swban, confirm, ${user.id}, ${until.valueOf()}`)
                .setStyle(ButtonStyle.Danger)
                .setLabel("Yes"),
            new ButtonBuilder()
                .setCustomId(`${message.author.id}%swban, cancel`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("No")
        );

        message.channel.send({ embeds: [embed], components: [actionRow] });
    },
    async interaction(client, interaction) {
        if (interaction.customTags[0] === "confirm") {
            const userId = interaction.customTags[1];
            const until = Number(interaction.customTags[2]);

            const reason = banReasons.get(userId) ?? "Not provided";

            client.stormworks.players.ensure(userId, {});
            client.stormworks.players.set(userId, { until, reason }, "ban");

            const embed = new EmbedBuilder();
            embed.setColor(client.config.colors.red);
            embed.setTitle("User Banned");
            embed.setDescription(`User <@${userId}> has been banned from in-game servers until <t:${Math.floor(until / 1000)}>.\n\nReason: ${reason}`);
            embed.setFooter({ text: `SWLink | Requested by ${interaction.member.displayName}` });
            interaction.message.edit({ embeds: [embed], components: [] });
        } else if (interaction.customTags[0] === "cancel") {
            const embed = new EmbedBuilder();
            embed.setDescription("Canceled.");
            embed.setFooter({ text: `SWLink | Requested by ${interaction.member.displayName}` });
            interaction.message.edit({ embeds: [embed], components: [] });
        }
    }
}