// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * Read through this file and the !faction command to learn how to use Factions.

const { ActionRowBuilder, SelectMenuBuilder } = require("discord.js");
const enmap = require("./enmapPatch.js");

const { Group, GroupRank, GroupMember } = require("./groupManager.js");

class Faction extends Group {
    // configuration: primary account id
    get primaryAccount() { return this.primaryAccountId !== null && this.client.economy.getAccount(this.primaryAccountId) ? this.client.economy.getAccount(this.primaryAccountId) : this.economyAccounts[0]; }
    get primaryAccountId() { return this.enmap.get(this.id, "configuration.primaryAccountId"); }
    set primaryAccountId(value) { return this.enmap.set(this.id, value, "configuration.primaryAccountId"); }

    get nationId() { return this.enmap.get(this.id, "nationId"); }

    set nationId(value) { this.enmap.set(this.id, value, "nationId"); }

    get nation() { return this.client.nations.getNation(this.nationId); }

    get owner() {
        return new GroupMember(this.enmap.get(this.id, "ownerId"), this);
    }

    get members() {
        return Object.keys(this.enmap.get(this.id, "members")).map(id => new GroupMember(id, this));
    }

    get ranks() {
        return Object.keys(this.enmap.get(this.id, "ranks")).map(id => new GroupRank(id, this));
    }

    getRank(id) {
        id = Number(id);
        return this.enmap.has(this.id, `ranks.${id}`) ? new GroupRank(id, this) : null;
    }

    getMember(userId) {
        return this.enmap.has(this.id, `members.${userId}`) ? new GroupMember(userId, this) : null;
    }

    addMember(userId) {
        if (this.getMember(userId)) return this.client.factions.enums.errors.factionAlreadyHasMember;
        GroupMember.create(this, userId);
        return new GroupMember(userId, this);
    }

    addRank() {
        return new GroupRank(GroupRank.create(this), this);
    }

    get economyAccounts() {
        return this.client.economy.accounts.filter(account => account.type === this.client.economy.enums.accountTypes("Faction") && account.ownerId === this.id).map((_, id) => this.client.economy.getAccount(id)).sort((a, b) => a.id - b.id);
    }

    delete() {
        for (const account of this.economyAccounts) account.delete();
        this.enmap.delete(this.id);
    }

    static create(client, name, id) {
        super.create(client.factions.factions, name, id);

        const faction = client.factions.getFaction(id);

        const memberRank = faction.addRank();
        memberRank.name = "Member";

        const vipRank = faction.addRank();
        vipRank.name = "VIP";
        vipRank.displayOrder = 2;

        const managerRank = faction.addRank();
        managerRank.name = "Manager";
        managerRank.displayOrder = 3;
        managerRank.canUseEconomyAccounts = true;

        const administratorRank = faction.addRank();
        administratorRank.name = "Administrator";
        administratorRank.displayOrder = 4;
        administratorRank.canUseEconomyAccounts = true;
        administratorRank.canDeleteEconomyAccounts = true;
        administratorRank.canRenameEconomyAccounts = true;
        administratorRank.canManageMembers = true;
        administratorRank.canEditDetails = true;

        return faction;
    }
}

module.exports.main = function(client) {
    client.factions = {
        enums: {
            errors: {
                factionAlreadyExists: "1x1 Faction Already Exists",
                factionAlreadyHasMember: "1x2 Faction Already Has Member"
            }
        },
        data: new enmap({ name: "Factions", wal: true }),
        factions: new enmap({ name: "Factions-Factions", wal: true }),
        getFaction: function(id) {
            id = Number(id);
            if (client.factions.factions.has(id)) {
                return new Faction(id, client, client.factions.factions);
            } else return null;
        },
        createFaction: function(name, id) {
            if (id === undefined) {
                id = client.factions.data.get("factionIdCounter");
                client.factions.data.inc("factionIdCounter");
            }
            id = Number(id);
            if (client.factions.factions.has(id)) {
                return client.factions.enums.errors.factionAlreadyExists;
            } else {
                return Faction.create(client, name, id);
            }
        },
        getFactions: function(userId) {
            return client.factions.factions.filter(faction => Object.keys(faction.members).includes(userId)).map((_, id) => Number(id)).sort((a, b) => a - b);
        },
        generateFactionSelectMenu: function(userId, customId) {
            const memberFactions = [];
            const factions = [];
            for (const faction of client.factions.factions.map((_, id) => client.factions.getFaction(id))) {
                if (faction.getMember(userId)) memberFactions.push(faction); else if (faction.id !== 0) factions.push(faction);
            }
            const sortedFactions = memberFactions.sort((a, b) => a.name.localeCompare(b.name)).concat(factions.sort((a, b) => a.name.localeCompare(b.name)));

            const actionRows = [];

            for (let i = 0; i < sortedFactions.length; i += 25) {
                const factions = sortedFactions.slice(i, i + 25);

                const selectMenu = new SelectMenuBuilder();
                selectMenu.setPlaceholder(i === 0 ? `Select a faction (* A - ${factions[factions.length - 1].name.charAt(0)})` : `Select a faction (${factions[0].name.charAt(0)} - ${factions[factions.length - 1].name.charAt(0)})`);//`Select a faction (${i + 1} - ${Math.min(i + 25, sortedFactions.length)})`);
                selectMenu.setCustomId(`${customId}, ${i}`);

                for (const faction of factions) {
                    selectMenu.addOptions({
                        label: faction.name,
                        description: faction.shortDescription,
                        value: faction.id.toString(),
                        emoji: faction.getMember(userId) ? "⭐" : undefined
                    });
                }

                actionRows.push(new ActionRowBuilder().addComponents(selectMenu));
            }

            return actionRows;
        }
    }

    client.factions.data.ensure("factionIdCounter", 1);
}