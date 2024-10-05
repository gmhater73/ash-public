// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * Leaderboards are implemented in Ash in an interesting (and verbose) way. Read this entire file to learn more.

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const moment = require("moment"); require("moment-duration-format");

const leaderboards = {
    economy: {
        default: "all",
        all: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Economy Leaderboard");

                const accounts = [];
                let combinedMoney = 0;
                for (const [id, account] of client.economy.accounts) {
                    if (account.type === client.economy.enums.accountTypes("Faction") && account.ownerId === 0) continue;
                    combinedMoney += account.balance;
                    accounts.push([account.name.includes("'s Personal Account") && account.users ? `<@${account.users[0]}>` : `\`#${id}\` ${account.name}`, account.balance, id]);
                }

                const top = accounts.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((accounts.length - 1) / 10) + 1}\nViewing ${accounts.length} accounts\n${combinedMoney.toLocaleString()} ${client.config.economy.moneySymbol} combined\n${client.economy.data.has("primaryAccounts", member.id) ? `Your rank is #${top.findIndex(account => account[2] == client.economy.data.get("primaryAccounts", member.id)) + 1}\n` : ""}`;
                let i = page * 10 + 1;
                for (const account of top.splice(page * 10, 10)) description += `\n**${i++})** ${account[0]} • ${account[1].toLocaleString()} ${client.config.economy.moneySymbol}`;

                embed.setDescription(description);

                embed.setFooter({ text: `Ash Economy | Requested by ${member.displayName}` });

                return embed;
            },
            page: function(client, page) {
                const max = Math.floor((client.economy.accounts.size - 1) / 10);
                return [ Math.min(page, max), max ];
            }
        },
        personal: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Economy Leaderboard");

                const accounts = [];
                let combinedMoney = 0;
                for (const [id, account] of client.economy.accounts.filter(account => account.type === client.economy.enums.accountTypes("Personal"))) {
                    combinedMoney += account.balance;
                    accounts.push([`<@${account.users[0]}>`, account.balance, id]);
                }

                const top = accounts.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((accounts.length - 1) / 10) + 1}\nViewing ${accounts.length} personal accounts\n${combinedMoney.toLocaleString()} ${client.config.economy.moneySymbol} combined\n${client.economy.data.has("primaryAccounts", member.id) ? `Your rank is #${top.findIndex(account => account[2] == client.economy.data.get("primaryAccounts", member.id)) + 1}\n` : ""}`;
                let i = page * 10 + 1;
                for (const account of top.splice(page * 10, 10)) description += `\n**${i++})** ${account[0]} • ${account[1].toLocaleString()} ${client.config.economy.moneySymbol}`;

                embed.setDescription(description);

                embed.setFooter({ text: `Ash Economy | Requested by ${member.displayName}` });

                return embed;
            },
            page: function(client, page) {
                const max = Math.floor((client.economy.accounts.filter(account => account.type === client.economy.enums.accountTypes("Personal")).size - 1) / 10);
                return [ Math.min(page, max), max ];
            }
        },
        nation: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Economy Leaderboard");

                const accounts = [];
                let combinedMoney = 0;
                for (const [id, account] of client.economy.accounts.filter(account => account.type === client.economy.enums.accountTypes("Nation"))) {
                    combinedMoney += account.balance;
                    accounts.push([`${client.nations.getNation(account.ownerId).emoji} \`#${id}\` ${account.name}`, account.balance]);
                }

                const top = accounts.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((accounts.length - 1) / 10) + 1}\nViewing ${accounts.length} nation accounts\n${combinedMoney.toLocaleString()} ${client.config.economy.moneySymbol} combined\n`;
                let i = page * 10 + 1;
                for (const account of top.splice(page * 10, 10)) description += `\n**${i++})** ${account[0]} • ${account[1].toLocaleString()} ${client.config.economy.moneySymbol}`;

                embed.setDescription(description);

                embed.setFooter({ text: `Ash Economy | Requested by ${member.displayName}` });

                return embed;
            },
            page: function(client, page) {
                const max = Math.floor((client.economy.accounts.filter(account => account.type === client.economy.enums.accountTypes("Nation")).size - 1) / 10);
                return [ Math.min(page, max), max ];
            }
        },
        faction: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Economy Leaderboard");

                const accounts = [];
                let combinedMoney = 0;
                for (const [id, account] of client.economy.accounts.filter(account => account.type === client.economy.enums.accountTypes("Faction"))) {
                    if (account.ownerId === 0) continue;
                    combinedMoney += account.balance;
                    accounts.push([`\`#${id}\` ${account.name}`, account.balance]);
                }

                const top = accounts.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((accounts.length - 1) / 10) + 1}\nViewing ${accounts.length} faction accounts\n${combinedMoney.toLocaleString()} ${client.config.economy.moneySymbol} combined\n`;
                let i = page * 10 + 1;
                for (const account of top.splice(page * 10, 10)) description += `\n**${i++})** ${account[0]} • ${account[1].toLocaleString()} ${client.config.economy.moneySymbol}`;

                embed.setDescription(description);

                embed.setFooter({ text: `Ash Economy | Requested by ${member.displayName}` });

                return embed;
            },
            page: function(client, page) {
                const max = Math.floor((client.economy.accounts.filter(account => account.type === client.economy.enums.accountTypes("Faction")).size - 1) / 10);
                return [ Math.min(page, max), max ];
            }
        }
    },
    nations: {
        default: "funds",
        defaultPage: function(client, page) {
            const max = Math.floor((client.nations.nations.size - 1) / 10);
            return [ Math.min(page, max), max ];
        },
        funds: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Nation Leaderboard");

                const nations = [];
                let combinedMoney = 0;
                for (const [id, nation] of client.nations.nations) {
                    const balance = client.economy.accounts.filterArray(account => account.type === client.economy.enums.accountTypes("Nation") && account.ownerId === Number(id)).map(account => account.balance).reduce((a, b) => a + b);
                    nations.push([`${nation.emoji} ${nation.name}`, balance]);
                    combinedMoney += balance;
                }

                const top = nations.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((nations.length - 1) / 10) + 1}\nViewing ${nations.length} nations sorted by total funds\n${combinedMoney.toLocaleString()} ${client.config.economy.moneySymbol} combined\n`;
                let i = page * 10 + 1;
                for (const nation of top.splice(page * 10, 10)) description += `\n**${i++})** ${nation[0]} • ${nation[1].toLocaleString()} ${client.config.economy.moneySymbol}`;

                embed.setDescription(description);

                embed.setFooter({ text: `Ash Nations | Requested by ${member.displayName}` });

                return embed;
            }
        },
        totalWealth: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Nation Leaderboard");

                const nations = [];
                for (const [id, nation] of client.nations.nations) {
                    const balance = client.economy.accounts.filterArray(account =>
                        (account.type === client.economy.enums.accountTypes("Nation") && account.ownerId === Number(id))
                        || (account.type === client.economy.enums.accountTypes("Faction") && client.factions.factions.get(account.ownerId, "nationId") === Number(id))
                        || (account.type === client.economy.enums.accountTypes("Personal") && account.users[0] in nation.members)
                    ).map(account => account.balance).reduce((a, b) => a + b);
                    nations.push([`${nation.emoji} ${nation.name}`, balance]);
                }

                const top = nations.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((nations.length - 1) / 10) + 1}\nViewing ${nations.length} nations sorted by total wealth\n`;
                let i = page * 10 + 1;
                for (const nation of top.splice(page * 10, 10)) description += `\n**${i++})** ${nation[0]} • ${nation[1].toLocaleString()} ${client.config.economy.moneySymbol}`;

                embed.setDescription(description);

                embed.setFooter({ text: `Ash Nations | Requested by ${member.displayName}` });

                return embed;
            }
        },
        totalWealthNoPersonal: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Nation Leaderboard");

                const nations = [];
                for (const [id, nation] of client.nations.nations) {
                    const balance = client.economy.accounts.filterArray(account =>
                        (account.type === client.economy.enums.accountTypes("Nation") && account.ownerId === Number(id))
                        || (account.type === client.economy.enums.accountTypes("Faction") && client.factions.factions.get(account.ownerId, "nationId") === Number(id))
                    ).map(account => account.balance).reduce((a, b) => a + b);
                    nations.push([`${nation.emoji} ${nation.name}`, balance]);
                }

                const top = nations.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((nations.length - 1) / 10) + 1}\nViewing ${nations.length} nations sorted by total wealth (nation and faction accounts only)\n`;
                let i = page * 10 + 1;
                for (const nation of top.splice(page * 10, 10)) description += `\n**${i++})** ${nation[0]} • ${nation[1].toLocaleString()} ${client.config.economy.moneySymbol}`;

                embed.setDescription(description);

                embed.setFooter({ text: `Ash Nations | Requested by ${member.displayName}` });

                return embed;
            }
        },
        citizens: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Nation Leaderboard");

                const nations = [];
                for (const [id, nation] of client.nations.nations) nations.push([`${nation.emoji} ${nation.name}`, Object.keys(nation.members).length - 1]);

                const top = nations.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((nations.length - 1) / 10) + 1}\nViewing ${nations.length} nations sorted by citizen count\n`;
                let i = page * 10 + 1;
                for (const nation of top.splice(page * 10, 10)) description += `\n**${i++})** ${nation[0]} • ${nation[1].toLocaleString()} citizens`;

                embed.setDescription(description);

                embed.setFooter({ text: `Ash Nations | Requested by ${member.displayName}` });

                return embed;
            }
        },
        factions: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Nation Leaderboard");

                const nations = [];
                for (const nation of client.nations.nations.map((nation, id) => client.nations.getNation(id))) nations.push([`${nation.emoji} ${nation.name}`, nation.factions.length]);

                const top = nations.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((nations.length - 1) / 10) + 1}\nViewing ${nations.length} nations sorted by faction count\n`;
                let i = page * 10 + 1;
                for (const nation of top.splice(page * 10, 10)) description += `\n**${i++})** ${nation[0]} • ${nation[1].toLocaleString()} factions`;

                embed.setDescription(description);

                embed.setFooter({ text: `Ash Nations | Requested by ${member.displayName}` });

                return embed;
            }
        },
        playtime: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Nation Leaderboard");

                const nations = [];
                for (const nation of client.nations.nations.map((nation, id) => client.nations.getNation(id))) nations.push([`${nation.emoji} ${nation.name}`, nation.members.reduce((accumulator, member) => accumulator + (client.stormworks.players.getDataFromDiscordId(member.id) ? client.stormworks.players.getDataFromDiscordId(member.id).playTime : 0), 0)]);

                const top = nations.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((nations.length - 1) / 10) + 1}\nViewing ${nations.length} nations sorted by combined playtime\n`;
                let i = page * 10 + 1;
                for (const nation of top.splice(page * 10, 10)) description += `\n**${i++})** ${nation[0]} • ${moment.duration(nation[1]).format("H [hrs], m [mins], s [secs]", true)}`;

                embed.setDescription(description);

                embed.setFooter({ text: `Ash Nations | Requested by ${member.displayName}` });

                return embed;
            }
        },
    },
    factions: {
        default: "funds",
        defaultPage: function(client, page) {
            const max = Math.floor((client.factions.factions.size - 1) / 10);
            return [ Math.min(page, max), max ];
        },
        funds: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Faction Leaderboard");

                const factions = [];
                let combinedMoney = 0;
                for (const [id, faction] of client.factions.factions) {
                    if (id === "0") continue;
                    const balance = client.economy.accounts.filterArray(account => account.type === client.economy.enums.accountTypes("Faction") && account.ownerId === Number(id)).map(account => account.balance).reduce((a, b) => a + b);
                    factions.push([faction.name, balance]);
                    combinedMoney += balance;
                }

                const top = factions.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((factions.length - 1) / 10) + 1}\nViewing ${factions.length} factions sorted by total funds\n${combinedMoney.toLocaleString()} ${client.config.economy.moneySymbol} combined\n`;
                let i = page * 10 + 1;
                for (const faction of top.splice(page * 10, 10)) description += `\n**${i++})** ${faction[0]} • ${faction[1].toLocaleString()} ${client.config.economy.moneySymbol}`;

                embed.setDescription(description);

                embed.setFooter({ text: `Ash Factions | Requested by ${member.displayName}` });

                return embed;
            }
        },
        members: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Faction Leaderboard");

                const factions = [];
                for (const [id, faction] of client.factions.factions) {
                    if (id === "0") continue;
                    factions.push([faction.name, Object.keys(faction.members).length - 1]);
                }

                const top = factions.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((factions.length - 1) / 10) + 1}\nViewing ${factions.length} factions sorted by member count\n`;
                let i = page * 10 + 1;
                for (const faction of top.splice(page * 10, 10)) description += `\n**${i++})** ${faction[0]} • ${faction[1].toLocaleString()} members`;

                embed.setDescription(description);

                embed.setFooter({ text: `Ash Factions | Requested by ${member.displayName}` });

                return embed;
            }
        },
    },
    game: {
        default: "playtime",
        defaultPage: function(client, page) {
            const max = Math.floor((client.stormworks.players.size - 1) / 10);
            return [ Math.min(page, max), max ];
        },
        playtime: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Player Leaderboard");

                const users = [];
                let combined = 0;
                for (const [id, data] of client.stormworks.players) {
                    combined += data.playTime ?? 0;
                    users.push([id, data.playTime]);
                }

                const top = users.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((users.length - 1) / 10) + 1}\nViewing ${users.length} users sorted by playtime\n${moment.duration(combined).format("D [days], H [hrs], m [mins]", true)} total playtime\nYour rank is #${top.findIndex(user => user[0] === member.id) + 1}\n`;
                let i = page * 10 + 1;
                for (const user of top.splice(page * 10, 10)) description += `\n**${i++})** <@${user[0]}> • ${moment.duration(user[1]).format("H [hrs], m [mins], s [secs]", true)}`;

                embed.setDescription(description);

                embed.setFooter({ text: `SWLink | Requested by ${member.displayName}` });

                return embed;
            }
        },
        averagePlaytimePerSession: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Player Leaderboard");

                const users = [];
                let combined = 0;
                let combinedJoins = 0;
                for (const [id, data] of client.stormworks.players) {
                    combined += data.playTime;
                    combinedJoins += data.timesJoined;
                    users.push([id, data.playTime / data.timesJoined]);
                }
                combined /= combinedJoins;

                const top = users.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((users.length - 1) / 10) + 1}\nViewing ${users.length} users sorted by average playtime per session\n${moment.duration(combined).format("D [days], H [hrs], m [mins]", true)} overall average playtime per session\nYour rank is #${top.findIndex(user => user[0] === member.id) + 1}\n`;
                let i = page * 10 + 1;
                for (const user of top.splice(page * 10, 10)) description += `\n**${i++})** <@${user[0]}> • ${moment.duration(user[1]).format("H [hrs], m [mins], s [secs]", true)}`;

                embed.setDescription(description);

                embed.setFooter({ text: `SWLink | Requested by ${member.displayName}` });

                return embed;
            }
        },
        joins: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Player Leaderboard");

                const users = [];
                let combined = 0;
                for (const [id, data] of client.stormworks.players) {
                    combined += data.timesJoined;
                    users.push([id, data.timesJoined]);
                }

                const top = users.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((users.length - 1) / 10) + 1}\nViewing ${users.length} users sorted by times joined\n${combined.toLocaleString()} total joins\nYour rank is #${top.findIndex(user => user[0] === member.id) + 1}\n`;
                let i = page * 10 + 1;
                for (const user of top.splice(page * 10, 10)) description += `\n**${i++})** <@${user[0]}> • ${user[1].toLocaleString()} joins`;

                embed.setDescription(description);

                embed.setFooter({ text: `SWLink | Requested by ${member.displayName}` });

                return embed;
            }
        },
        deaths: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Player Leaderboard");

                const users = [];
                let combined = 0;
                for (const [id, data] of client.stormworks.players) {
                    combined += data.timesDied;
                    users.push([id, data.timesDied]);
                }

                const top = users.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((users.length - 1) / 10) + 1}\nViewing ${users.length} users sorted by deaths\n${combined.toLocaleString()} total deaths\nYour rank is #${top.findIndex(user => user[0] === member.id) + 1}\n`;
                let i = page * 10 + 1;
                for (const user of top.splice(page * 10, 10)) description += `\n**${i++})** <@${user[0]}> • ${user[1].toLocaleString()} deaths`;

                embed.setDescription(description);

                embed.setFooter({ text: `SWLink | Requested by ${member.displayName}` });

                return embed;
            }
        },
        lastPlayed: {
            execute: function(client, member, page) {
                const embed = new EmbedBuilder();
                embed.setColor(member.displayColor);
                embed.setTitle("Player Leaderboard");

                const users = [];
                for (const [id, data] of client.stormworks.players) users.push([id, Math.floor(data.lastPlayed / 1000)]);

                const top = users.sort((a, b) => b[1] - a[1]);

                let description = `Page ${page + 1} of ${Math.floor((users.length - 1) / 10) + 1}\nViewing ${users.length} users sorted by last played\nYour rank is #${top.findIndex(user => user[0] === member.id) + 1}\n`;
                let i = page * 10 + 1;
                for (const user of top.splice(page * 10, 10)) description += `\n**${i++})** <@${user[0]}> • <t:${user[1]}:R>`;

                embed.setDescription(description);

                embed.setFooter({ text: `SWLink | Requested by ${member.displayName}` });

                return embed;
            }
        },
    }
}

module.exports = {
    name: "leaderboard",
    applicationCommands: [
        {
            name: "leaderboard",
            description: "Leaderboard",
            type: 1, // Slash command
            options: [
                {
                    name: "economy",
                    description: "View leaderboard for economy data",
                    type: 1,
                    options: [
                        {
                            name: "data",
                            description: "Leaderboard",
                            required: false,
                            type: 3,
                            choices: [
                                {
                                    name: "All accounts",
                                    value: "all"
                                },
                                {
                                    name: "Personal accounts",
                                    value: "personal"
                                },
                                {
                                    name: "Nation accounts",
                                    value: "nation"
                                },
                                {
                                    name: "Faction accounts",
                                    value: "faction"
                                }
                            ]
                        },
                        {
                            name: "page",
                            description: "Leaderboard page",
                            required: false,
                            type: 4,
                            min_value: 1
                        }
                    ]
                },
                {
                    name: "nations",
                    description: "View leaderboard for nation data",
                    type: 1,
                    options: [
                        {
                            name: "data",
                            description: "Leaderboard",
                            required: false,
                            type: 3,
                            choices: [
                                {
                                    name: "Funds",
                                    value: "funds"
                                },
                                {
                                    name: "Total wealth",
                                    value: "totalWealth"
                                },
                                {
                                    name: "Total wealth (excluding personal accounts)",
                                    value: "totalWealthNoPersonal"
                                },
                                {
                                    name: "Citizen count",
                                    value: "citizens"
                                },
                                {
                                    name: "Faction count",
                                    value: "factions"
                                },
                                {
                                    name: "Combined playtime",
                                    value: "playtime"
                                }
                            ]
                        },
                        {
                            name: "page",
                            description: "Leaderboard page",
                            required: false,
                            type: 4,
                            min_value: 1
                        }
                    ]
                },
                {
                    name: "factions",
                    description: "View leaderboard for faction data",
                    type: 1,
                    options: [
                        {
                            name: "data",
                            description: "Leaderboard",
                            required: false,
                            type: 3,
                            choices: [
                                {
                                    name: "Funds",
                                    value: "funds"
                                },
                                {
                                    name: "Member count",
                                    value: "members"
                                },
                            ]
                        },
                        {
                            name: "page",
                            description: "Leaderboard page",
                            required: false,
                            type: 4,
                            min_value: 1
                        }
                    ]
                },
                {
                    name: "game",
                    description: "View leaderboard for Stormworks data",
                    type: 1,
                    options: [
                        {
                            name: "data",
                            description: "Leaderboard",
                            required: false,
                            type: 3,
                            choices: [
                                {
                                    name: "Playtime",
                                    value: "playtime"
                                },
                                {
                                    name: "Average playtime per session",
                                    value: "averagePlaytimePerSession"
                                },
                                {
                                    name: "Times joined",
                                    value: "joins"
                                },
                                {
                                    name: "Deaths",
                                    value: "deaths"
                                },
                                {
                                    name: "Last played",
                                    value: "lastPlayed"
                                },
                            ]
                        },
                        {
                            name: "page",
                            description: "Leaderboard page",
                            required: false,
                            type: 4,
                            min_value: 1
                        }
                    ]
                }
            ],
            execute: function (client, interaction) {
                const leaderboard = leaderboards[interaction.options.getSubcommand()][interaction.options.getString("data") ?? leaderboards[interaction.options.getSubcommand()]["default"]];

                const [page, max] = (leaderboard.page ?? leaderboards[interaction.options.getSubcommand()]["defaultPage"]) (client, interaction.options.getInteger("page") ? interaction.options.getInteger("page") - 1 : 0);

                const actionRow = new ActionRowBuilder();
                actionRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${interaction.user.id}%leaderboard, ${interaction.options.getSubcommand()}, ${interaction.options.getString("data") ?? leaderboards[interaction.options.getSubcommand()]["default"]}, ${page - 1}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel("Prev")
                        .setEmoji("◀️")
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId(`${interaction.user.id}%leaderboard, ${interaction.options.getSubcommand()}, ${interaction.options.getString("data") ?? leaderboards[interaction.options.getSubcommand()]["default"]}, ${page + 1}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel("Next")
                        .setEmoji("▶️")
                        .setDisabled(page === max)
                );

                interaction.reply({ embeds: [ leaderboard.execute(client, interaction.member, page) ], components: [ actionRow ] });
            }
        },
    ],
    interaction(client, interaction) {
        const leaderboard = leaderboards[interaction.customTags[0]][interaction.customTags[1]];

        const [page, max] = (leaderboard.page ?? leaderboards[interaction.customTags[0]]["defaultPage"]) (client, Number(interaction.customTags[2]));

        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`${interaction.user.id}%leaderboard, ${interaction.customTags[0]}, ${interaction.customTags[1]}, ${page - 1}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Prev")
                .setEmoji("◀️")
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`${interaction.user.id}%leaderboard, ${interaction.customTags[0]}, ${interaction.customTags[1]}, ${page + 1}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Next")
                .setEmoji("▶️")
                .setDisabled(page === max)
        );

        interaction.update({ embeds: [ leaderboard.execute(client, interaction.member, page) ], components: [ actionRow ] });
    }
}