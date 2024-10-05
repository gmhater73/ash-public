// Ash Public
// @.fuckme
// * This version of Ash omits the SWLink server reflection system.
// * The verification and player data system is intact. Many parts of Ash rely on verification. You will have to roll your own verification process for Ash to work properly.
// * For now you may use async client.stormworks.verify(discordId: string, steamId: string)
// * For a Stormworks server-authoritative verification system you will want to add HTTP routes that verify, update, and return verification (and ban) data for a player.
// * Ash used a backend-authoritative verification system which mitigated the need for this and made implementation much easier. See line 160
// * Player data functions start at line 102 - read this whole file to get an idea on how to manage player data

const enmap = require("./enmapPatch.js");

const app = require("express")();

const moment = require("moment"); require("moment-duration-format");

module.exports.main = async function(client) {
    // Ash Universal API

    // Increment user balance
    // /ash/economy/balance/increment/user?steamid=[Steam ID]&amount=[Amount]
    // Returns:
    // Error: [400/404/422/500 (Bad request / Not found / Impossible / Server error)]~[Error code]~[Error detail]
    // OK: [200 (OK)]~[User primary account ID]~[New user primary account balance]~[Old user primary account balance]
    app.get("/ash/economy/balance/increment/user", async (req, res) => {
        try {
            if (!req.query.steamid) return res.send("400~1~Missing SteamId");
            if (!req.query.amount) return res.send("400~2~Missing Amount");

            req.query.amount = Number(req.query.amount);

            if (isNaN(req.query.amount)) return res.send("400~3~Amount Not A Number");

            const discordId = client.stormworks.players.getDiscordIdFromSteamId(req.query.steamid);
            if (!discordId) return res.send("404~1~No Player Data");

            const user = await client.users.fetch(discordId);
            if (!user) return res.send("404~1~No Player Data");

            const primaryAccount = client.economy.getPrimaryAccount(discordId);
            if (!primaryAccount) return res.send("404~1~No Player Data");

            // disable increment user balance if pool is empty
            if (client.economy.getAccount(0).balance < Math.max(-req.query.amount, 0)) return res.send("500~1~Unknown Error");

            if (Math.max(primaryAccount.balance, 0) < Math.max(-req.query.amount, 0)) return res.send("422~1~Insufficient Funds");

            if (req.query.amount >= 0) {
                let amountAfterTax = req.query.amount;
                for (const nation of client.nations.getNations(discordId).map(id => client.nations.getNation(id))) {
                    const tax = nation.getMember(discordId).inGameActivitiesTax;
                    if (tax > 0) {
                        const amount = Math.floor(req.query.amount * tax);
                        amountAfterTax -= amount;
                        nation.taxDestinationAccount.balance += amount;
                        nation.taxDestinationAccount.addHistory(`📥 Received ${amount.toLocaleString()} ${client.config.economy.moneySymbol} from in-game activities tax (${tax * 100}%)`);
                    }
                }
                primaryAccount.addHistory(`📥 Received ${amountAfterTax.toLocaleString()} ${client.config.economy.moneySymbol} from in-game activity${amountAfterTax !== req.query.amount ? ` (${req.query.amount.toLocaleString()} ${client.config.economy.moneySymbol} before tax)` : ""}`);
                primaryAccount.balance += amountAfterTax;
            } else {
                primaryAccount.addHistory( `📤 Lost ${(-req.query.amount).toLocaleString()} ${client.config.economy.moneySymbol} from in-game activity`);
                primaryAccount.balance += req.query.amount;
            }

            //primaryAccount.addHistory(req.query.amount >= 0 ? `📥 Received ${req.query.amount.toLocaleString()} ${client.config.economy.moneySymbol} from in-game activity` : `📤 Lost ${(-req.query.amount).toLocaleString()} ${client.config.economy.moneySymbol} from in-game activity`);

            //primaryAccount.balance += req.query.amount;
            client.economy.getAccount(0).balance -= req.query.amount;

            res.send(`200~${primaryAccount.id}~${primaryAccount.balance}~${primaryAccount.balance - req.query.amount}`);
        } catch { return res.send("500~1~Unknown Error"); }
    });
    // Post Discord message
    // /ash/postmessage?message=[Message]&serverid=[Server ID]
    // Returns:
    // Error: [400/500/503 (Bad request / Server error / Not available)]~[Error code]~[Error detail]
    // OK: 200
    /*app.get("/ash/postmessage", async (req, res) => {
        try {
            if (!req.query.message) return res.send("400~1~Missing Message");
            if (!req.query.serverid) return res.send("400~2~Missing Server ID");
            //if (!req.query.message.includes("Vehicle")) return res.send("503~1~Not Allowed"); // generic is such a comedian

            const server = client.stormworks.servers[Number(req.query.serverid) - 1];
            if (server.webhook) server.webhook.send(`**${SWInterface.unescape(req.query.message).replaceAll("@", "(@)")}**`);

            res.send("200");
        } catch { return res.send("500~1~Unknown Error"); }
    });*/

    // Main
    client.stormworks = {
        //enums,
        players: new enmap({ name: "Stormworks-Players", wal: true }),
        //servers: Array.from(client.ssm.servers.keys()).filter(key => !key.toString().startsWith("_")).map(id => new client.ssm.Server(id)).sort((a, b) => a.id - b.id).filter(server => server.missions.includes("AshStormworksAPI")).map(server => new Server(new SWInterface(server.id)))//[new Server(new SWInterface(1)), new Server(new SWInterface(2))]
    }

    client.stormworks.app = app;
    app.listen(3000, () => client.log("bgGreen", "SWLINK", "[modules/stormworksLink.js]: Started on port 3000"));

    // Player data
    client.stormworks.players.getDiscordIdFromSteamId = id => client.stormworks.players.findKey("steamId", id);
    client.stormworks.players.getSteamIdFromDiscordId = id => client.stormworks.players.has(id) ? client.stormworks.players.get(id, "steamId") : null;
    client.stormworks.players.getDataFromDiscordId = id => client.stormworks.players.get(id);
    client.stormworks.players.getDataFromSteamId = id => client.stormworks.players.find("steamId", id);

    // Bans
    client.stormworks.players.getBan = id => {
        const data = client.stormworks.players.getDataFromDiscordId(id);
        if (!data) return null;
        if (!data.ban) return null;
        if (data.ban.until <= Date.now()) { client.stormworks.players.delete(id, "ban"); return null; }
        return data.ban;
    }

    // Webhooks
    const disconnectedMessages = [
        "Server disconnected",
    ];
    /*for (const server of client.stormworks.servers) {
        const ssmServer = new client.ssm.Server(server.interface.id);
        if (ssmServer.webhook) {
            server.webhook = ssmServer.webhook;
            server.on(enums.events.chatMessage, message => server.webhook.send(`**${message.author.name.replaceAll("@", "(@)")}**: ${message.content.replaceAll("@", "(@)")}`));
            server.on(enums.events.playerJoin, player => server.webhook.send(`:inbox_tray: **[${player.name.replaceAll("@", "(@)")}](<https://steamcommunity.com/profiles/${player.steamId}>) joined the game**`));
            server.on(enums.events.playerLeave, player => {
                if (client.ssm.hasBlacklist(player.steamId)) server.webhook.send(`:outbox_tray: **Catch join attempt [${player.steamId}](<https://steamcommunity.com/profiles/${player.steamId}>)**`);
                else server.webhook.send(`:outbox_tray: **[${player.name.replaceAll("@", "(@)")}](<https://steamcommunity.com/profiles/${player.steamId}>) left the game** (${moment.duration(player.sessionTime).format("H[h] m[m]", true)})`);
            });
            server.on(enums.events.playerDie, player => server.webhook.send(`:skull: **${player.name.replaceAll("@", "(@)")} died**`));
            server.on(enums.events.connected, serverInitiated => { if (serverInitiated) server.webhook.send(":green_circle: **Server connected**"); });
            server.on(enums.events.disconnected, () => { if (ssmServer.isRunning) server.webhook.send(`:warning: **${disconnectedMessages[Math.floor(Math.random() * disconnectedMessages.length)]}**`); });//":warning: **Server disconnected**"));
        }
    }*/

    // Account linking
    const guild = await client.guilds.fetch(client.config.public.serverId);
    const verifiedRole = await guild.roles.fetch(client.config.public.verifiedRoleId);

    client.stormworks.tempLinkCodes = new Map();
    client.stormworks.tempLinkCodes.find = function(searchValue) { for (const [key, value] of client.stormworks.tempLinkCodes.entries()) if (value === searchValue) return key; }

    async function getMember(user) {
        try {
            return await guild.members.fetch({ user, force: true });
        } catch(error) {
            if (guild.available && error.message === "Unknown Member") return null;
            return await guild.members.fetch({ user });
        }
    }

    /*for (const server of client.stormworks.servers) {
        // Account linking
        server.on(enums.events.playerJoin, async player => {
            const discordId = client.stormworks.players.getDiscordIdFromSteamId(player.steamId);

            const ban = client.stormworks.players.getBan(discordId);
            if (ban) {
                server.removeAuth(player.peerId);
                player.sendMessage("[Server]", `Welcome to StormLands. You are banned until ${new Date(ban.until).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC.`);
                player.sendMessage("", `Reason: ${ban.reason}`);
                player.sendMessage("", "You will be kicked in 20 seconds.");
                server.drawPopupScreen(player.peerId, 696969, "You are banned and will be kicked in 20 seconds", 0, 0);
                return setTimeout(() => server.custom("kickPlayer", player.peerId), 30000);
            }

            player.sendMessage("[SWLink]", "Discord message reflection: enabled.");
            player.sendMessage("", "Please note! Your chat messages will be reflected in the Discord server.");
            player.sendMessage("", "Messages sent from Discord will be prefixed with [D].");

            const member = discordId ? await getMember(discordId) : null;

            if (!member) {
                //if (discordId) client.stormworks.players.delete(discordId, "steamId");
                server.removeAuth(player.peerId);
                server.drawPopupScreen(player.peerId, 696969, "Please verify to receive auth", -0.88, 0.88);
                if (discordId) {
                    player.sendMessage("[Server]", "Welcome back to StormLands. Verification data has been restored for your account.");
                    player.sendMessage("", "In order to receive auth, you must be a member of the Discord server.");
                    player.sendMessage("", "Please join at https://discord.gg/---------- and then rejoin the game.");
                    server.drawPopupScreen(player.peerId, 696970, "Join Discord server at\n\ndiscord.gg\n/----------\nand then rejoin the game", -0.88, 0.63);
                } else {
                    player.sendMessage("[Server]", "Welcome to StormLands. In order to receive auth, you must link your Discord account.");
                    player.sendMessage("", "Please join our Discord server at https://discord.gg/---------- and follow the instructions in #introduction.");
                    server.drawPopupScreen(player.peerId, 696970, "Join Discord server at\n\ndiscord.gg\n/----------\nand follow instructions in #introduction", -0.88, 0.63);
                }
            } else if (member instanceof Error) {
                console.error(member);
                server.removeAuth(player.peerId);
                player.sendMessage("[Server]", "Internal error occurred. You may not be authorized.");
                player.sendMessage("", "Please rejoin the server. If this error keeps happening, contact staff.");
                player.sendMessage("", "Join the Discord server at https://discord.gg/----------");
            } else {
                player.sendMessage("[Server]", `Welcome back to StormLands. You are linked to ${member.user.username}.`);
                server.addAuth(player.peerId);
                client.stormworks.players.inc(discordId, "timesJoined");
                client.stormworks.players.set(discordId, Date.now(), "lastPlayed");
                if (!verifiedRole.members.has(member.id)) member.roles.add(verifiedRole, `Autoverified: Data found, but member did not have role`);
            }

            server.drawPopupScreen(player.peerId, 696971, "[Attention]\n\nWorkshop vehicles are not allowed in this server", -0.88, 0);
            setTimeout(() => server.custom("removePopup", player.peerId, 696971), 25000);
        });
        server.on(enums.events.chatCommand, async function(message, command, args) {
            if (command === "link" && !client.stormworks.players.getDiscordIdFromSteamId(message.author.steamId)) {
                args[0] = args[0].toLowerCase();
                if (client.stormworks.tempLinkCodes.has(args[0])) {
                    const discordId = client.stormworks.tempLinkCodes.get(args[0]);

                    client.stormworks.players.ensure(discordId, {});
                    client.stormworks.players.update(discordId, { steamId: message.author.steamId, verifiedTimestamp: Date.now() });
                    client.stormworks.players.ensure(discordId, 1, "timesJoined");
                    client.stormworks.players.ensure(discordId, 0, "timesDied");
                    client.stormworks.players.ensure(discordId, 0, "playTime");
                    client.stormworks.players.ensure(discordId, Date.now(), "lastPlayed");

                    client.stormworks.tempLinkCodes.delete(args[0]);

                    const member = await guild.members.fetch(discordId);
                    member.roles.add(verifiedRole, `Verified: Steam ID ${message.author.steamId}`);
                    message.author.sendMessage("[Server]", `Thank you for linking to Discord. You are now linked to ${member.user.username}.`);
                    server.sendMessage("[Server]", `${message.author.name} linked their acccount to ${member.user.username}`);
                    server.custom("removePopup", message.author.peerId, 696969);
                    server.custom("removePopup", message.author.peerId, 696970);
                    server.addAuth(message.author.peerId);
                    if (server.webhook) server.webhook.send(`:link: **${message.author.name.replaceAll("@", "(@)")} linked their account to ${member.user.username}**`);
                    member.send(`Successfully linked to ${message.author.name} (${message.author.steamId}).`);
                } else message.author.sendMessage("[Server]", "That code is invalid. Please run !link in Discord to get a new code.");
            }
        });

        // Update data
        server.on(enums.events.playerDie, player => {
            const discordId = client.stormworks.players.getDiscordIdFromSteamId(player.steamId);
            if (discordId) client.stormworks.players.inc(discordId, "timesDied");
        });
        server.on(enums.events.playerLeave, player => {
            const discordId = client.stormworks.players.getDiscordIdFromSteamId(player.steamId);
            if (discordId) {
                client.stormworks.players.set(discordId, client.stormworks.players.getDataFromDiscordId(discordId).playTime + player.sessionTime, "playTime");
                client.stormworks.players.set(discordId, Date.now(), "lastPlayed");
            }
        });
    }*/

    client.stormworks.verify = async function(discordId, steamId) {
        client.stormworks.players.ensure(discordId, {});
        client.stormworks.players.update(discordId, { steamId: steamId, verifiedTimestamp: Date.now() });
        client.stormworks.players.ensure(discordId, 1, "timesJoined");
        client.stormworks.players.ensure(discordId, 0, "timesDied");
        client.stormworks.players.ensure(discordId, 0, "playTime");
        client.stormworks.players.ensure(discordId, Date.now(), "lastPlayed");

        const member = await guild.members.fetch(discordId);
        member.roles.add(verifiedRole, `Verified: Steam ID ${steamId}`);
        member.send(`Successfully linked to ${steamId}.`);
    }

    // Bidirectional chat
    /*client.on("messageCreate", message => {
        if (message.webhookId || message.author.bot) return;
        for (const server of client.stormworks.servers) {
            const ssmServer = new client.ssm.Server(server.interface.id);
            if (ssmServer.availableFast && message.channel.id === ssmServer.settings.chatChannel && server.online) {
                server.sendMessage(`[D]:${message.author.username}`, `${message.attachments.size > 0 ? "[Attachment] " : ""}${message.content}`);
            }
        }
    });*/
}