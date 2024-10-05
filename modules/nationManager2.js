// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * Read through this file and the !nation command to learn how to use Nations.
// * It is recommended that you set up an easy way for nation administrators to configure their nations taxes. This hypothetical interface never made it into any version of Ash.

const { SelectMenuBuilder } = require("discord.js");
const enmap = require("./enmapPatch.js");

const { Group, GroupRank, GroupMember } = require("./groupManager.js");

class NationRank extends GroupRank {
    get taxes() { return this.group.enmap.ensure(this.group.id, {}, `ranks.${this.id}.taxes`); }
    // personal account income tax
    get personalIncomeTax() { return this.group.enmap.ensure(this.group.id, 0, `ranks.${this.id}.taxes.personalIncome`); }
    set personalIncomeTax(value) { return this.group.enmap.set(this.group.id, value, `ranks.${this.id}.taxes.personalIncome`); }
    // personal account outgoing tax
    get personalOutgoingTax() { return this.group.enmap.ensure(this.group.id, 0, `ranks.${this.id}.taxes.personalOutgoing`); }
    set personalOutgoingTax(value) { return this.group.enmap.set(this.group.id, value, `ranks.${this.id}.taxes.personalOutgoing`); }
    // in-game activites tax (cargo)
    get inGameActivitiesTax() { return this.group.enmap.ensure(this.group.id, 0, `ranks.${this.id}.taxes.inGameActivities`); }
    set inGameActivitiesTax(value) { return this.group.enmap.set(this.group.id, value, `ranks.${this.id}.taxes.inGameActivities`); }
}

class NationMember extends GroupMember {
    // personal account income tax
    get personalIncomeTax() { return this.rank.personalIncomeTax; }
    // personal account outgoing tax
    get personalOutgoingTax() { return this.rank.personalOutgoingTax; }
    // in-game activites tax (cargo)
    get inGameActivitiesTax() { return this.rank.inGameActivitiesTax; }
}

class Nation extends Group {
    // configuration: faction income tax
    get factionIncomeTax() { return this.enmap.ensure(this.id, 0, "configuration.factionIncomeTax"); }
    set factionIncomeTax(value) { return this.enmap.set(this.id, value, "configuration.factionIncomeTax"); }
    // configuration: faction outgoing tax
    get factionOutgoingTax() { return this.enmap.ensure(this.id, 0, "configuration.factionOutgoingTax"); }
    set factionOutgoingTax(value) { return this.enmap.set(this.id, value, "configuration.factionOutgoingTax"); }
    // configuration: primary account id
    get primaryAccount() { return this.primaryAccountId && this.client.economy.getAccount(this.primaryAccountId) ? this.client.economy.getAccount(this.primaryAccountId) : this.economyAccounts[0]; }
    get primaryAccountId() { return this.enmap.get(this.id, "configuration.primaryAccountId"); }
    set primaryAccountId(value) { return this.enmap.set(this.id, value, "configuration.primaryAccountId"); }
    // configuration: tax proceeds account id
    get taxDestinationAccount() { return this.taxDestinationAccountId && this.client.economy.getAccount(this.taxDestinationAccountId) ? this.client.economy.getAccount(this.taxDestinationAccountId) : this.primaryAccount; }
    get taxDestinationAccountId() { return this.enmap.get(this.id, "configuration.taxDestinationAccountId"); }
    set taxDestinationAccountId(value) { return this.enmap.set(this.id, value, "configuration.taxDestinationAccountId"); }

    get emoji() { return this.enmap.get(this.id, "emoji"); }

    set emoji(value) { return this.enmap.set(this.id, value, "emoji"); }

    get owner() {
        return new NationMember(this.enmap.get(this.id, "ownerId"), this);
    }

    get members() {
        return Object.keys(this.enmap.get(this.id, "members")).map(id => new NationMember(id, this));
    }

    get ranks() {
        return Object.keys(this.enmap.get(this.id, "ranks")).map(id => new NationRank(id, this));
    }

    getRank(id) {
        id = Number(id);
        return this.enmap.has(this.id, `ranks.${id}`) ? new NationRank(id, this) : null;
    }

    getMember(userId) {
        return this.enmap.has(this.id, `members.${userId}`) ? new NationMember(userId, this) : null;
    }

    addMember(userId) {
        if (this.getMember(userId)) return this.client.nations.enums.errors.nationAlreadyHasMember;
        NationMember.create(this, userId);
        return new NationMember(userId, this);
    }

    addRank() {
        return new NationRank(NationRank.create(this), this);
    }

    get economyAccounts() {
        return this.client.economy.accounts.filter(account => account.type === this.client.economy.enums.accountTypes("Nation") && account.ownerId === this.id).map((_, id) => this.client.economy.getAccount(id)).sort((a, b) => a.id - b.id);
    }

    get factions() {
        return this.client.factions.factions.filter(faction => faction.nationId === this.id).map((_, id) => this.client.factions.getFaction(id)).sort((a, b) => a.id - b.id);
    }

    delete() {
        for (const account of this.economyAccounts) account.delete();
        this.enmap.delete(this.id);
    }

    static create(client, name, id) {
        super.create(client.nations.nations, name, id);

        const nation = client.nations.getNation(id);

        const citizenRank = nation.addRank();
        citizenRank.name = "Citizen";

        const vipRank = nation.addRank();
        vipRank.name = "VIP";
        vipRank.displayOrder = 2;

        const managerRank = nation.addRank();
        managerRank.name = "Manager";
        managerRank.displayOrder = 3;
        managerRank.canUseEconomyAccounts = true;

        const administratorRank = nation.addRank();
        administratorRank.name = "Administrator";
        administratorRank.displayOrder = 4;
        administratorRank.canUseEconomyAccounts = true;
        administratorRank.canDeleteEconomyAccounts = true;
        administratorRank.canRenameEconomyAccounts = true;
        administratorRank.canManageMembers = true;
        administratorRank.canEditDetails = true;

        return nation;
    }
}

module.exports.main = function(client) {
    client.nations = {
        enums: {
            errors: {
                nationAlreadyExists: "1x1 Nation Already Exists",
                nationAlreadyHasMember: "1x2 Nation Already Has Member"
            }
        },
        data: new enmap({ name: "Nations", wal: true }),
        nations: new enmap({ name: "Nations-Nations", wal: true }),
        getNation: function(id) {
            id = Number(id);
            if (client.nations.nations.has(id)) {
                return new Nation(id, client, client.nations.nations);
            } else return null;
        },
        createNation: function(name, id) {
            if (id === undefined) {
                id = client.nations.data.get("nationIdCounter");
                client.nations.data.inc("nationIdCounter");
            }
            id = Number(id);
            if (client.nations.nations.has(id)) {
                return client.nations.enums.errors.nationAlreadyExists;
            } else {
                return Nation.create(client, name, id);
            }
        },
        getNations: function(userId) {
            return client.nations.nations.filter(nation => Object.keys(nation.members).includes(userId)).map((_, id) => Number(id)).sort((a, b) => a - b);
        },
        generateNationSelectMenu: function(userId) {
            const selectMenu = new SelectMenuBuilder();
            selectMenu.setPlaceholder("No nation selected");

            const memberNations = [];
            const nations = [];
            for (const nation of client.nations.nations.map((_, id) => client.nations.getNation(id))) {
                if (nation.getMember(userId)) memberNations.push(nation); else nations.push(nation);
            }
            for (const nation of memberNations.sort((a, b) => a.name.localeCompare(b.name)).concat(nations.sort((a, b) => a.name.localeCompare(b.name)))) {
                selectMenu.addOptions({
                    label: nation.name,
                    description: nation.shortDescription,
                    value: nation.id.toString(),
                    emoji: nation.getMember(userId) ? "⭐" : nation.emoji
                });
            }

            return selectMenu;
        }
    }

    client.nations.data.ensure("nationIdCounter", 1);
}