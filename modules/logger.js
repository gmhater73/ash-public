// Ash Public
// @.fuckme
// * Please provide your own webhooks to log errors and database changes, and then uncomment the file. See lines 7 and 8

const { EmbedBuilder, WebhookClient } = require("discord.js");

//const logWebhook = new WebhookClient({ url: "" });
//const errorWebhook = new WebhookClient({ url: "" });

module.exports.main = function(client) {
    /*process.on("rejectionHandled", error => {
        error.stack = error.stack.substring(0, 800);

        if (!client.isReady()) return;

        const embed = new EmbedBuilder();
        embed.setColor(client.config.colors.green);
        embed.setTitle("[ OK ] Promise Rejection Handled");
        embed.addFields(
            { name: "Name", value: error.name, inline: true },
            { name: "Message", value: error.message, inline: true },
            { name: "Stack", value: `\`\`\`js\n${error.stack}\`\`\`` },
        );
        errorWebhook.send({ avatarURL: client.user.avatarURL(), embeds: [embed] });
    });
    process.on("unhandledRejection", error => {
        error.stack = error.stack.substring(0, 800);

        if (!client.isReady()) return;

        const embed = new EmbedBuilder();
        embed.setTitle("Unhandled Promise Rejection");
        embed.addFields(
            { name: "Name", value: error.name, inline: true },
            { name: "Message", value: error.message, inline: true },
            { name: "Stack", value: `\`\`\`js\n${error.stack}\`\`\`` },
        );
        embed.setFooter({ text: "A promise has been rejected but no error handler was attached to the promise" });
        errorWebhook.send({ avatarURL: client.user.avatarURL(), embeds: [embed] });
    });
    process.setUncaughtExceptionCaptureCallback(async error => {
        error.stack = error.stack.substring(0, 800);

        if (!client.isReady()) return;

        const embed = new EmbedBuilder();
        embed.setColor(client.config.colors.red);
        embed.setTitle("Uncaught Exception");
        embed.addFields(
            { name: "Name", value: error.name, inline: true },
            { name: "Message", value: error.message, inline: true },
            { name: "Stack", value: `\`\`\`js\n${error.stack}\`\`\`` },
        );
        embed.setFooter({ text: "Ash force quit with exit code 1" });
        await errorWebhook.send({ avatarURL: client.user.avatarURL(), embeds: [embed] });

        process.emit("uncaughtException", error);
    });

    // wait for enmap initialization before listening for changes
    client.on("ready", () => {
        client.economy.accounts.changed((id, oldValue, newValue) => {
            setTimeout(() => {
                try {
                    if (!oldValue) {
                        const account = client.economy.getAccount(id);

                        const embed = new EmbedBuilder();
                        embed.setTitle("Account Created");
                        embed.setDescription(`Account #${id}`);
                        embed.addFields(
                            { name: "Name", value: newValue.name, inline: true },
                            { name: "Owner", value: account.formattedOwner, inline: true },
                            { name: "Type", value: client.economy.enums.accountTypes.from(newValue.type), inline: true },
                            { name: "Balance", value: `${newValue.balance} ${client.config.economy.moneySymbol}`, inline: true }
                        );
                        embed.setFooter({ text: "Ash Economy" });
                        embed.setTimestamp();
                        logWebhook.send({ avatarURL: client.user.avatarURL(), embeds: [embed], content: `createdaccount${id}` });
                    } else {
                        const account = client.economy.getAccount(id);
                        if (!account) {
                            const embed = new EmbedBuilder();
                            embed.setColor(client.config.colors.red);
                            embed.setTitle("Account Deleted");
                            embed.setDescription(`Account #${id}`);
                            embed.addFields(
                                { name: "Name", value: oldValue.name, inline: true },
                                { name: "Type", value: client.economy.enums.accountTypes.from(oldValue.type), inline: true },
                                { name: "Balance", value: `${oldValue.balance} ${client.config.economy.moneySymbol}`, inline: true }
                            );
                            embed.setFooter({ text: "Ash Economy" });
                            embed.setTimestamp();
                            logWebhook.send({ avatarURL: client.user.avatarURL(), embeds: [embed], content: `deletedaccount${id}` });
                            return;
                        }

                        newValue = client.economy.accounts.get(id);

                        const embed = new EmbedBuilder();
                        embed.setTitle("Account Updated");
                        embed.setDescription(`Account #${id}`);
                        embed.addFields(
                            { name: "Name", value: newValue.name, inline: true },
                            { name: "Owner", value: account.formattedOwner, inline: true },
                            { name: "Type", value: client.economy.enums.accountTypes.from(newValue.type), inline: true },
                        );

                        let users = "";
                        for (const user of account.getUsersWithPermission(client.economy.enums.permissions("UseAccount"))) users += `<@${user}>, `;
                        embed.addFields({ name: "Users", value: users.slice(0, -2) });

                        let changes = "";
                        for (const [key, value] of Object.entries(newValue)) {
                            if (typeof value === "object") continue;
                            if (oldValue[key] !== value) changes += `${key} :: ${oldValue[key]} --> ${value}\n`;
                        }
                        if (changes === "") return;

                        embed.addFields({ name: "Changes", value: `\`\`\`asciidoc\n${changes}\`\`\`` });
                        embed.setFooter({ text: "Ash Economy" });
                        embed.setTimestamp();
                        logWebhook.send({ avatarURL: client.user.avatarURL(), embeds: [embed], content: `updatedaccount${id} bal${account.balance}` });
                    }
                } catch {}
            }, 100);
        });
    });*/
}