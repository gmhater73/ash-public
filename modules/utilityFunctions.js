// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * Do not use client.gitPull if you have not set up git on your system and in Ash's working directory.

const { exec } = require("child_process");

module.exports.Enum = class {
    constructor(...values) {
        const instance = function(value) {
            return values.indexOf(value);
        }
        instance.from = index => values[index];
        return instance;
    }
}

module.exports.main = function(client) {
    client.getUser = async function(message, string = "0") {
        try {
            return await message.guild.members.fetch(string);
        } catch {
            return message.mentions.members.first() ? message.mentions.members.first() : message.member;
        }
    }
    client.getUsers = async function(message, string = "0") {
        string = string.replaceAll("\n", " ").replace(/[^0-9 ]/gi, "").trim();
        if (string.length < 1) string = "0";
        return Array.from((await message.guild.members.fetch({ user: string.split(" ").filter(string => string !== "") })).values());
    }
    client.getTargetUser = async function(message, string = "0") {
        try {
            return await message.guild.members.fetch(string);
        } catch {
            return message.mentions.members.first();
        }
    }
    client.generateCommandErrorVisualization = function(content, argumentIndex, error = "Error: Contact developer", formatted = true) {
        content = content.replaceAll(`<@${client.user.id}>`, client.config.prefix.length).replaceAll(/<@(.+?)>/g, "<@User>").replaceAll(/<@(.+?)>/g, "<@User>");

        const args = content.slice(client.config.prefix.length).trim().split(/ +/);

        let numRepeats = 1;
        for (const string of args.slice(0, argumentIndex + 1)) { numRepeats += string.length + 1; }

        const spacing = " ".repeat(numRepeats);
        const carets = "^".repeat((args[argumentIndex + 1] ? args[argumentIndex + 1] : "^").length);

        return formatted ? `\`\`\`${content}\n${spacing}${carets}\n${spacing}${error}\`\`\`` : `${content}\n${spacing}${carets}\n${spacing}${error}`;
    }
    client.benchmark = function(func, ...args) {
        let total = 0;
        for (let i = 0; i < 10; i++) {
            const start = performance.now();
            func(...args);
            total += performance.now() - start;
        }
        return total / 10;
    }
    client.gitPull = function() {
        return new Promise((resolve, reject) => {
            exec("git pull", { windowsHide: true }, (err, stdout) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stdout);
                }
            });
        });
    }
}