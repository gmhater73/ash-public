// Ash Public
// @.fuckme
// * The economy system is the original defining Ash feature. IT is pretty important.
// * This file is presented in its entire unmodified form.
// * Read through this file and the !account and !balance commands to learn how to use Economy.

const { Enum } = require("./utilityFunctions.js");
const enmap = require("./enmapPatch.js");

class AccountReference {
    constructor(id, client, enmap) {
        this.id = id;
        this.client = client;
        this.enmap = enmap;
    }

    get name() { return this.enmap.get(this.id, "name"); }
    get balance() { return this.enmap.get(this.id, "balance"); }
    get history() { return this.enmap.ensure(this.id, [], "history"); }

    set name(value) { this.enmap.set(this.id, value, "name"); }
    set balance(value) { this.enmap.set(this.id, value, "balance"); }

    addHistory(data) {
        const history = this.history;
        history.unshift({
            time: Math.floor(Date.now() / 1000),
            data: data
        });
        this.enmap.set(this.id, history.slice(0, 20), "history");
    }
    delete() {
        if (this.balance !== 0) this.client.economy.getAccount(0).balance += this.balance;
        this.enmap.delete(this.id);
    }
}

class PersonalAccountReference extends AccountReference {
    constructor(id, client, enmap) {
        super(id, client, enmap);
        this.type = this.client.economy.enums.accountTypes("Personal");
    }

    get owner() { return this.enmap.get(this.id, "users")[0]; }
    get formattedOwner() { return `<@${this.owner}>`; }

    addUser(userId) { this.enmap.push(this.id, userId, "users"); }
    removeUser(userId) { this.enmap.remove(this.id, userId, "users"); }

    getUsersWithPermission() { // variable # of arguments: permissions
        const users = [];
        for (const permission of arguments) {
            switch (permission) {
                case this.client.economy.enums.permissions("UseAccount"):
                    users.push(...this.enmap.get(this.id, "users"));
                    break;
                case this.client.economy.enums.permissions("DeleteAccount"):
                    users.push(this.owner);
                    break;
                case this.client.economy.enums.permissions("RenameAccount"):
                    users.push(this.owner);
                    break;
            }
        }
        return [...new Set(users)];
    }
    hasPermission(userId, permission) {
        if (this.client.config.staff.admins.includes(userId)) return true;

        switch (permission) {
            case this.client.economy.enums.permissions("UseAccount"):
                return this.enmap.get(this.id, "users").includes(userId);
            case this.client.economy.enums.permissions("DeleteAccount"):
                return userId === this.owner;
            case this.client.economy.enums.permissions("RenameAccount"):
                return userId === this.owner;
        }

        return false;
    }

    static create(client, name, balance, id) {
        client.economy.accounts.set(id, { name, balance, type: client.economy.enums.accountTypes("Personal"), users: [] });
    }
}

class FactionAccountReference extends AccountReference {
    constructor(id, client, enmap) {
        super(id, client, enmap);
        this.type = this.client.economy.enums.accountTypes("Faction");
    }

    get ownerId() { return this.enmap.get(this.id, "ownerId"); }
    set ownerId(value) { this.enmap.set(this.id, value, "ownerId"); }

    get owner() { return this.client.factions.getFaction(this.ownerId); }
    get formattedOwner() { return this.owner?.name; }

    getUsersWithPermission() { // variable # of arguments: permissions
        const permissions = Array.from(arguments);
        return this.owner.members.filter(member => 
            (permissions.includes(this.client.economy.enums.permissions("UseAccount")) && member.canUseEconomyAccounts)
            || (permissions.includes(this.client.economy.enums.permissions("DeleteAccount")) && member.canDeleteEconomyAccounts)
            || (permissions.includes(this.client.economy.enums.permissions("RenameAccount")) && member.canRenameEconomyAccounts)
        ).map(member => member.id);
    }
    hasPermission(userId, permission) {
        if (this.client.config.staff.admins.includes(userId)) return true;
        
        const member = this.owner.getMember(userId);
        if (!member) return false;

        switch (permission) {
            case this.client.economy.enums.permissions("UseAccount"):
                return member.canUseEconomyAccounts && (this.ownerId === 0 || this.owner.nation !== null);
            case this.client.economy.enums.permissions("DeleteAccount"):
                return member.canDeleteEconomyAccounts;
            case this.client.economy.enums.permissions("RenameAccount"):
                return member.canRenameEconomyAccounts;
        }

        return false;
    }

    static create(client, name, balance, id) {
        client.economy.accounts.set(id, { name, balance, type: client.economy.enums.accountTypes("Faction") });
    }
}

class NationAccountReference extends AccountReference {
    constructor(id, client, enmap) {
        super(id, client, enmap);
        this.type = this.client.economy.enums.accountTypes("Nation");
    }

    get ownerId() { return this.enmap.get(this.id, "ownerId"); }
    set ownerId(value) { this.enmap.set(this.id, value, "ownerId"); }

    get owner() { return this.client.nations.getNation(this.ownerId); }
    get formattedOwner() { return `${this.owner?.emoji} ${this.owner?.name}`; }

    getUsersWithPermission() { // variable # of arguments: permissions
        const permissions = Array.from(arguments);
        return this.owner.members.filter(member => 
            (permissions.includes(this.client.economy.enums.permissions("UseAccount")) && member.canUseEconomyAccounts)
            || (permissions.includes(this.client.economy.enums.permissions("DeleteAccount")) && member.canDeleteEconomyAccounts)
            || (permissions.includes(this.client.economy.enums.permissions("RenameAccount")) && member.canRenameEconomyAccounts)
        ).map(member => member.id);
    }
    hasPermission(userId, permission) {
        if (this.client.config.staff.admins.includes(userId)) return true;
        
        const member = this.owner.getMember(userId);
        if (!member) return false;

        switch (permission) {
            case this.client.economy.enums.permissions("UseAccount"):
                return member.canUseEconomyAccounts;
            case this.client.economy.enums.permissions("DeleteAccount"):
                return member.canDeleteEconomyAccounts;
            case this.client.economy.enums.permissions("RenameAccount"):
                return member.canRenameEconomyAccounts;
        }

        return false;
    }

    static create(client, name, balance, id) {
        client.economy.accounts.set(id, { name, balance, type: client.economy.enums.accountTypes("Nation") });
    }
}

module.exports.main = function(client) {
    client.economy = {
        enums: {
            errors: {
                accountAlreadyExists: "1x1 Account Already Exists"
            },
            accountTypes: new Enum("Personal", "Faction", "Nation"),
            permissions: new Enum("UseAccount", "DeleteAccount", "RenameAccount")
        },
        data: new enmap({ name: "Economy", wal: true }),
        accounts: new enmap({ name: "Economy-Accounts", wal: true }),
        getAccount: function(id) {
            id = Number(id);
            if (!client.economy.accounts.has(id)) return null;
            switch (client.economy.accounts.get(id, "type")) {
                case client.economy.enums.accountTypes("Personal"):
                    return new PersonalAccountReference(id, client, client.economy.accounts);
                case client.economy.enums.accountTypes("Faction"):
                    return new FactionAccountReference(id, client, client.economy.accounts);
                case client.economy.enums.accountTypes("Nation"):
                    return new NationAccountReference(id, client, client.economy.accounts);
                default:
                    return new PersonalAccountReference(id, client, client.economy.accounts);
            }
        },
        createAccount: function(name = "Account", startingBalance = 0, type = client.economy.enums.accountTypes("Personal"), id, force = false) {
            if (id === undefined) {
                id = client.economy.data.get("accountIdCounter");
                client.economy.data.inc("accountIdCounter");
            }
            id = Number(id);
            if (client.economy.accounts.has(id) && !force) {
                return client.economy.enums.errors.accountAlreadyExists;
            } else {
                switch (type) {
                    case client.economy.enums.accountTypes("Personal"):
                        PersonalAccountReference.create(client, name, startingBalance, id);
                        break;
                    case client.economy.enums.accountTypes("Faction"):
                        FactionAccountReference.create(client, name, startingBalance, id);
                        break;
                    case client.economy.enums.accountTypes("Nation"):
                        NationAccountReference.create(client, name, startingBalance, id);
                        break;
                }
                const account = client.economy.getAccount(id);
                if (account && startingBalance > 0) client.economy.getAccount(0).balance -= startingBalance;
                return account;
            }
        },
        /*getAccounts: function(userId) {
            const accounts = [];
            for (const accountId of Array.from(client.economy.accounts.keys())) if (client.economy.getAccount(accountId).hasPermission(userId, client.economy.enums.permissions("UseAccount"))) accounts.push(Number(accountId));
            return accounts;
        },*/
        getAccounts: function(userId) { // fast implementation
            const accounts = [];

            const factions = client.factions.getFactions(userId); // this can be made faster
            const nations = client.nations.getNations(userId); // this too

            for (const [id, account] of client.economy.accounts) {
                switch (account.type) {
                    case 0: { // client.economy.enums.accountTypes("Personal"): // fast check for personal accounts - simply check if users array includes the userId
                        if (account.users.includes(userId)) accounts.push(Number(id));
                        break;
                    }
                    case 1: { // fast check for faction accounts - use prebuilt factions array
                        if (factions.includes(account.ownerId)) {
                            const ranks = client.factions.factions.get(account.ownerId, "ranks");
                            if (Object.entries(client.factions.factions.get(account.ownerId, "members")).some(([memberId, member]) => memberId === userId && ranks[member.rankId].permissions?.canUseEconomyAccounts)) accounts.push(Number(id));
                        }
                        //if (factions.includes(account.ownerId)) accounts.push(Number(id));
                        break;
                    }
                    case 2: { // fast check for nation accounts - use prebuilt nations array
                        if (nations.includes(account.ownerId)) {
                            const ranks = client.nations.nations.get(account.ownerId, "ranks");
                            if (Object.entries(client.nations.nations.get(account.ownerId, "members")).some(([memberId, member]) => memberId === userId && ranks[member.rankId].permissions?.canUseEconomyAccounts)) accounts.push(Number(id));
                        }
                        //if (nations.includes(account.ownerId)) accounts.push(Number(id));
                        break;
                    }
                    default: { // fall back to default checking if type is unknown or no fast check is available for type
                        if (client.economy.getAccount(id).hasPermission(userId, client.economy.enums.permissions("UseAccount"))) accounts.push(Number(id));
                    }
                }
            }

            return accounts.sort((a, b) => a - b);
        },
        getPrimaryAccount: function(userId, autoCreate = true) {
            const user = client.users.cache.get(userId);
            if (autoCreate && (!client.economy.data.has("primaryAccounts", userId) || !client.economy.getAccount(client.economy.data.get("primaryAccounts", userId))) && user && !user.bot) {
                const account = client.economy.createAccount(user.username + "'s Personal Account", 500);
                account.addUser(userId);
                client.economy.data.set("primaryAccounts", account.id, userId);
            }
            return client.economy.data.has("primaryAccounts", userId) ? client.economy.getAccount(client.economy.data.get("primaryAccounts", userId)) : null;
        },
        calculateTransactionTaxes: function(amount, source, destination) {
            const taxes = [];

            // system accounts exempt
            if (source.type === client.economy.enums.accountTypes("Faction") && source.ownerId === 0) return [];
            if (destination.type === client.economy.enums.accountTypes("Faction") && destination.ownerId === 0) return [];

            // simple transfer between accounts owned by same person exempt
            if (
                (
                    source.type === client.economy.enums.accountTypes("Personal") && destination.type === client.economy.enums.accountTypes("Personal")
                    && source.owner === destination.owner
                ) ||
                (
                    source.type === client.economy.enums.accountTypes("Personal") && destination.type === client.economy.enums.accountTypes("Faction")
                    && source.owner === destination.owner.owner
                ) ||
                (
                    source.type === client.economy.enums.accountTypes("Faction") && destination.type === client.economy.enums.accountTypes("Personal")
                    && source.owner.owner === destination.owner
                ) ||
                (
                    source.type === client.economy.enums.accountTypes("Faction") && destination.type === client.economy.enums.accountTypes("Faction")
                    && (source.owner.owner === destination.owner.owner || source.ownerId === destination.ownerId)
                ) ||
                (
                    source.type === client.economy.enums.accountTypes("Personal") && destination.type === client.economy.enums.accountTypes("Nation")
                    && source.owner === destination.owner.ownerId
                ) ||
                (
                    source.type === client.economy.enums.accountTypes("Faction") && destination.type === client.economy.enums.accountTypes("Nation")
                    && source.owner.owner === destination.owner.ownerId
                ) ||
                (
                    source.type === client.economy.enums.accountTypes("Nation") && destination.type === client.economy.enums.accountTypes("Faction")
                    && source.owner.ownerId === destination.owner.owner
                )
            ) return [];

            switch (source.type) {
                case client.economy.enums.accountTypes("Personal"): {
                    for (const nation of client.nations.getNations(source.owner).map(id => client.nations.getNation(id))) {
                        const tax = nation.getMember(source.owner).personalOutgoingTax;
                        if (tax > 0) {
                            taxes.push({
                                amount: Math.floor(tax * amount),
                                tax,
                                to: nation.taxDestinationAccount,
                                reason: "Outgoing tax"
                            });
                        }
                    }
                    break;
                }
                case client.economy.enums.accountTypes("Faction"): {
                    const nation = source.owner.nation;
                    if (!nation) break;
                    const tax = nation.factionOutgoingTax;
                    if (tax > 0) {
                        taxes.push({
                            amount: Math.floor(tax * amount),
                            tax,
                            to: nation.taxDestinationAccount,
                            reason: "Faction outgoing tax"
                        });
                    }
                    break;
                }
            }
            switch (destination.type) {
                case client.economy.enums.accountTypes("Personal"): {
                    for (const nation of client.nations.getNations(destination.owner).map(id => client.nations.getNation(id))) {
                        if (source.type === client.economy.enums.accountTypes("Nation") && nation.id === source.ownerId) continue;
                        const tax = nation.getMember(destination.owner).personalIncomeTax;
                        if (tax > 0) {
                            taxes.push({
                                amount: Math.floor(tax * amount),
                                tax,
                                to: nation.taxDestinationAccount,
                                reason: "Income tax"
                            });
                        }
                    }
                    break;
                }
                case client.economy.enums.accountTypes("Faction"): {
                    const nation = destination.owner.nation;
                    if (!nation) break;
                    if (source.type === client.economy.enums.accountTypes("Nation") && nation.id === source.ownerId) break;
                    const tax = nation.factionIncomeTax;
                    if (tax > 0) {
                        taxes.push({
                            amount: Math.floor(tax * amount),
                            tax,
                            to: nation.taxDestinationAccount,
                            reason: "Faction income tax"
                        });
                    }
                    break;
                }
            }
            return taxes;
        }
    }

    client.economy.data.ensure("primaryAccounts", {});
    client.economy.data.ensure("accountIdCounter", 1);
}