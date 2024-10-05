// Ash Public
// @.fuckme
// * The web system for this version of Ash omits the website and all backend services required to run it except for the GraphQL API.
// * The GraphQL API can be interacted with by external programs. In this version of Ash it requires no authorization. See the reference schema. :80/api/graphql
// * You may navigate to [IP]/api/graphql in your browser to access the online GraphiQL IDE, which lets you easily experiment with GraphQL queries.

// * In Ash there was an external GraphQL API available on port 80 and an internal GraphQL API available on port 3000.
// * These two APIs differed only in the fact that the internal API was player-agnostic, while the external API relied on website authorization and provided additional data fields for the authorized player.
// * This version of Ash omits internal GraphQL API as the SWLink is omitted from this version. Use the external GraphQL API below instead, which is now player-agnostic.

const client = process.client;

const fs = require("node:fs");

const express = require("express");

const { makeExecutableSchema } = require("@graphql-tools/schema");
const { graphqlHTTP } = require("express-graphql");

const app = express();

app.use(require("body-parser").json());

client.web = { app };

async function getMember(user, force = false) {
    const guild = await client.guilds.fetch(client.config.public.serverId);
    try {
        return await guild.members.fetch({ user, force });
    } catch (error) {
        if (guild.available && error.message.includes("Unknown")) return null;
        return await guild.members.fetch({ user, force });
    }
}

// Ash API
const graphQLSchema = makeExecutableSchema({
    typeDefs: fs.readFileSync("./web/referenceSchema.graphql").toString(),
    resolvers: {
        Account: {
            __resolveType(object, context, info) {
                switch (object.type) {
                    case client.economy.enums.accountTypes("Personal"): {
                        return "PersonalAccount"
                    }
                    case client.economy.enums.accountTypes("Faction"): {
                        return "FactionAccount"
                    }
                    case client.economy.enums.accountTypes("Nation"): {
                        return "NationAccount"
                    }
                }
                return null;
            }
        },
        GroupRank: {
            __resolveType(object, context, info) {
                return object instanceof GroupRank ? "FactionRank" : "NationRank";
            }
        },
        GroupMember: {
            __resolveType(object, context, info) {
                return object instanceof GroupMember ? "FactionMember" : "NationMember";
            }
        },
        Group: {
            __resolveType(object, context, info) {
                return object instanceof Faction ? "Faction" : "Nation";
            }
        }
    }
});

class User {
    constructor(id, req) {
        this.id = id;
        this._req = req;
    }

    get username() {
        return new Promise(async (resolve, reject) => {
            const member = await getMember(this.id);
            if (!member || member instanceof Error) return resolve(null);
            resolve(member.user.username);
        });
    }
    get display_name() {
        return new Promise(async (resolve, reject) => {
            const member = await getMember(this.id);
            if (!member || member instanceof Error) return resolve(null);
            resolve(member.user.username);//displayName);
        });
    }
    get avatar() {
        return new Promise(async (resolve, reject) => {
            const member = await getMember(this.id);
            if (!member || member instanceof Error) return resolve(null);
            resolve(member.user.avatar);
        });
    }
    /*get banner() {
        return new Promise(async (resolve, reject) => {
            const member = await getMember(this.id);
            if (!member || member instanceof Error) return resolve(null);
            if (!member.user.banner) {
                client.users.fetch(this.id, { force: true }).then(user => resolve(user.banner)).catch(() => resolve(null));
            } else resolve(member.user.banner);
        });
    }*/
    get color() {
        return new Promise(async (resolve, reject) => {
            const member = await getMember(this.id);
            if (!member || member instanceof Error) return resolve(null);
            if (!member.user.accentColor) {
                client.users.fetch(this.id, { force: true }).then(user => resolve(user.accentColor)).catch(() => resolve(null));
            } else resolve(member.user.accentColor);
        });
    }

    get verified() { return client.stormworks.players.has(this.id); }
    get steam_id() { return client.stormworks.players.getSteamIdFromDiscordId(this.id); }
    get verification_timestamp() { return client.stormworks.players.has(this.id) ? client.stormworks.players.get(this.id, "verifiedTimestamp") : null; }
    get playtime() { return client.stormworks.players.has(this.id) ? client.stormworks.players.get(this.id, "playTime") : null; }
    get times_joined() { return client.stormworks.players.has(this.id) ? client.stormworks.players.get(this.id, "timesJoined") : null; }
    get deaths() { return client.stormworks.players.has(this.id) ? client.stormworks.players.get(this.id, "timesDied") : null; }
    get last_played() { return client.stormworks.players.has(this.id) ? client.stormworks.players.get(this.id, "lastPlayed") : null; }

    get accounts() {
        return client.economy.getAccounts(this.id).map(accountId => Account.typedAccountObject(accountId, this._req));
    }
    get nations() {
        return client.nations.getNations(this.id).map(nationId => new Nation(nationId, this._req));
    }
    get factions() {
        return client.factions.getFactions(this.id).map(factionId => new Faction(factionId, this._req));
    }

    get primary_account() { return this.verified || client.economy.getPrimaryAccount(this.id, false) ? Account.typedAccountObject(client.economy.getPrimaryAccount(this.id).id, this._req) : null; }
}

class AccountUser {
    constructor(account, userId, req) {
        this._req = req;
        this._userId = userId;
        this.account = account;
    }

    get user() { return new User(this._userId, this._req); }
    get p_use() { return this.account._account.hasPermission(this._userId, client.economy.enums.permissions("UseAccount")); }
    get p_delete() { return this.account._account.hasPermission(this._userId, client.economy.enums.permissions("DeleteAccount")); }
    get p_rename() { return this.account._account.hasPermission(this._userId, client.economy.enums.permissions("RenameAccount")); }
}

class Account {
    constructor(id, req) {
        this.id = id;
        this._req = req;
        this._account = client.economy.getAccount(id);
    }

    get name() { return this._account.name; }
    get type() { return this._account.type; }
    get balance() { return this._account.balance; }
    get history() { return this._account.history; }

    get users() { return this._account.getUsersWithPermission(client.economy.enums.permissions("UseAccount"), client.economy.enums.permissions("DeleteAccount"), client.economy.enums.permissions("RenameAccount")).map(userId => new AccountUser(this, userId, this._req)); }

    static typedAccountObject(id, req) {
        switch (client.economy.accounts.get(id, "type")) {
            case client.economy.enums.accountTypes("Personal"): {
                return new PersonalAccount(id, req);
            }
            case client.economy.enums.accountTypes("Faction"): {
                return new FactionAccount(id, req);
            }
            case client.economy.enums.accountTypes("Nation"): {
                return new NationAccount(id, req);
            }
        }
        return null;
    }
}
class PersonalAccount extends Account {
    get owner() { return new User(this._account.owner, this._req); }
}
class FactionAccount extends Account {
    get owner() { return new Faction(this._account.ownerId, this._req); }
}
class NationAccount extends Account {
    get owner() { return new Nation(this._account.ownerId, this._req); }
}

class GroupRank {
    constructor(rank, req) {
        this._rank = rank;
        this._req = req;
        this.group = rank.group;
    }

    get id() { return this._rank.id; }
    get name() { return this._rank.name; }
    get display_order() { return this._rank.displayOrder; }
    get permissions() { return this._rank.permissions; }
    get members() { return this._rank.members.map(member => new GroupMember(member, this._req)); }
}

class GroupMember {
    constructor(member, req) {
        this._member = member;
        this._req = req;
        this.group = member.group;
    }

    get user() { return new User(this._member.id, this._req); }
    get rank() { return new GroupRank(this._member.rank, this._req); }

    get p_use_economy_accounts() { return this._member.canUseEconomyAccounts; }
    get p_delete_economy_accounts() { return this._member.canDeleteEconomyAccounts; }
    get p_rename_economy_accounts() { return this._member.canRenameEconomyAccounts; }
    get p_manage_members() { return this._member.canManageMembers; }
    get p_edit_details() { return this._member.canEditDetails; }
}

class Group {
    constructor(id, req) {
        this.id = id;
        this._req = req;
        this._group = null;
    }

    get owner() { return new GroupMember(this._group.owner, this._req); }

    get name() { return this._group.name; }
    get description() { return this._group.description; }
    get short_description() { return this._group.shortDescription; }
    get color() { return parseInt(this._group.color.substring(1), 16); } // hex to base 10
    get display_image() { return this._group.displayImage; }
    get creation_timestamp() { return this._group.creationTimestamp; }

    get members() { return this._group.members.map(member => new GroupMember(member, this._req)); }
    get ranks() { return this._group.ranks.map(rank => new GroupRank(rank, this._req)); }
}

class FactionConfiguration {
    constructor(group, req) {
        this._group = group;
        this._req = req;
    }

    get primary_account() { return new FactionAccount(this._group.primaryAccount.id, this._req); }
}

class Faction extends Group {
    constructor(id, req) {
        super(id, req);
        this._group = client.factions.getFaction(id);
    }

    get owner() { return new GroupMember(this._group.owner, this._req); }

    get members() { return this._group.members.map(member => new GroupMember(member, this._req)); }
    get ranks() { return this._group.ranks.map(rank => new GroupRank(rank, this._req)); }

    get nation() { return this._group.nation ? new Nation(this._group.nationId, this._req): null; }
    get accounts() { return this._group.economyAccounts.map(account => new FactionAccount(account.id, this._req)); }

    get configuration() { return new FactionConfiguration(this._group, this._req); }
}

class NationRank extends GroupRank {
    get members() { return this._rank.members.map(member => new NationMember(member, this._req)); }
    get taxes() { return this._rank.taxes; }
}

class NationMember extends GroupMember {
    get rank() { return new NationRank(this._member.rank, this._req); }
}

class NationConfiguration {
    constructor(group, req) {
        this._group = group;
        this._req = req;
    }

    get faction_income_tax() { return this._group.factionIncomeTax; }
    get faction_outgoing_tax() { return this._group.factionOutgoingTax; }
    get primary_account() { return new NationAccount(this._group.primaryAccount.id, this._req); }
    get tax_destination_account() { return new NationAccount(this._group.taxDestinationAccount.id, this._req); }
}

class Nation extends Group {
    constructor(id, req) {
        super(id, req);
        this._group = client.nations.getNation(id);
    }

    get owner() { return new NationMember(this._group.owner, this._req); }

    get members() { return this._group.members.map(member => new NationMember(member, this._req)); }
    get ranks() { return this._group.ranks.map(rank => new NationRank(rank, this._req)); }

    get accounts() { return this._group.economyAccounts.map(account => new NationAccount(account.id, this._req)); }
    get factions() { return this._group.factions.map(faction => new Faction(faction.id, this._req)); }

    get configuration() { return new NationConfiguration(this._group, this._req); }
}

// req { userId: current user Discord ID }
const graphQLRoot = {
    user: async function(args, req) {
        return new User(args.id, req);
    },
    account: function(args, req) {
        if (!client.economy.accounts.has(args.id)) return null;
        return Account.typedAccountObject(args.id, req);
    },
    nation: function(args, req) {
        if (!client.nations.nations.has(args.id)) return null;
        return new Nation(args.id, req);
    },
    faction: function(args, req) {
        if (!client.factions.factions.has(args.id)) return null;
        return new Faction(args.id, req);
    },

    user_from_steam_id: function(args, req) {
        const id = client.stormworks.players.getDiscordIdFromSteamId(args.id);
        if (!id) return null;
        return new User(id, req);
    },

    nations: function(args, req) {
        return client.nations.nations.map((_, id) => new Nation(id, req));
    },
    factions: function(args, req) {
        return client.factions.factions.map((_, id) => new Faction(id, req));
    },
}

app.use("/api/graphql", graphqlHTTP({
    schema: graphQLSchema,
    rootValue: graphQLRoot,
    graphiql: true // temporary
}));

client.graphql = {
    schema: graphQLSchema,
    root: graphQLRoot
}

app.listen(80, () => client.log("bgGreen", "WEB", "Web server started on port 80"));