// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.
// * Factions and Nations both inherit from Groups. Common functionality such as permissions, accounts, and details are implemented here.
// * The switch to the Groups system was made on 5 November 2022 for Nations and 4 February 2023 for Factions.
// * Read through this file as well as Faction Manager 2 and Nation Manager 2 to learn more about using Groups.
// * It is recommended that you set up an easy way for group administrators to configure their group permissions. This hypothetical interface never made it into any version of Ash.

class GroupRank {
    constructor(id, group) {
        this.id = Number(id);
        this.group = group;
    }

    get name() { return this.group.enmap.get(this.group.id, `ranks.${this.id}.name`); }

    get displayOrder() { return this.group.enmap.get(this.group.id, `ranks.${this.id}.displayOrder`); }

    set name(value) { return this.group.enmap.set(this.group.id, value, `ranks.${this.id}.name`); }

    set displayOrder(value) { return this.group.enmap.set(this.group.id, value, `ranks.${this.id}.displayOrder`); }

    get members() { return this.group.members.filter(member => member.rankId === this.id); }

    get permissions() { return this.group.enmap.ensure(this.group.id, {}, `ranks.${this.id}.permissions`); }

    // Permission: can use economy accounts
    get canUseEconomyAccounts() { return this.group.enmap.ensure(this.group.id, false, `ranks.${this.id}.permissions.canUseEconomyAccounts`); }
    set canUseEconomyAccounts(value) { return this.group.enmap.set(this.group.id, value, `ranks.${this.id}.permissions.canUseEconomyAccounts`); }
    // Permission: can delete economy accounts
    get canDeleteEconomyAccounts() { return this.group.enmap.ensure(this.group.id, false, `ranks.${this.id}.permissions.canDeleteEconomyAccounts`); }
    set canDeleteEconomyAccounts(value) { return this.group.enmap.set(this.group.id, value, `ranks.${this.id}.permissions.canDeleteEconomyAccounts`); }
    // Permission: can rename economy accounts
    get canRenameEconomyAccounts() { return this.group.enmap.ensure(this.group.id, false, `ranks.${this.id}.permissions.canRenameEconomyAccounts`); }
    set canRenameEconomyAccounts(value) { return this.group.enmap.set(this.group.id, value, `ranks.${this.id}.permissions.canRenameEconomyAccounts`); }
    // Permission: can manage members
    get canManageMembers() { return this.group.enmap.ensure(this.group.id, false, `ranks.${this.id}.permissions.canManageMembers`); }
    set canManageMembers(value) { return this.group.enmap.set(this.group.id, value, `ranks.${this.id}.permissions.canManageMembers`); }
    // Permission: can edit details (change description and image)
    get canEditDetails() { return this.group.enmap.ensure(this.group.id, false, `ranks.${this.id}.permissions.canEditDetails`); }
    set canEditDetails(value) { return this.group.enmap.set(this.group.id, value, `ranks.${this.id}.permissions.canEditDetails`); }

    delete() {
        if (this.group.ranks.length === 1) return false;
        this.group.enmap.delete(this.group.id, `ranks.${this.id}`);
        for (const member of this.members) member.rankId = this.group.ranks.sort((a, b) => a.displayOrder - b.displayOrder)[0].id;
        return true;
    }

    static create(group) {
        group.enmap.set(group.id, {
            displayOrder: 1
        }, `ranks.${group.rankIdCounter + 1}`); // the + 1 shouldnt be necessary but it is i guess
        group.rankIdCounter += 1;
        return group.rankIdCounter;
    }
}

class GroupMember {
    constructor(id, group) {
        this.id = id;
        this.group = group;
    }

    get rankId() { return this.group.enmap.get(this.group.id, `members.${this.id}.rankId`); }

    set rankId(value) { return this.group.enmap.set(this.group.id, Number(value), `members.${this.id}.rankId`); }

    get rank() { return this.group.getRank(this.rankId); }

    get isOwner() { return this.group.ownerId === this.id; }

    // Permission: can use economy accounts
    get canUseEconomyAccounts() { return this.isOwner || this.rank.canUseEconomyAccounts; }
    // Permission: can delete economy accounts
    get canDeleteEconomyAccounts() { return this.isOwner || this.rank.canDeleteEconomyAccounts; }
    // Permission: can rename economy accounts
    get canRenameEconomyAccounts() { return this.isOwner || this.rank.canRenameEconomyAccounts; }
    // Permission: can manage members
    get canManageMembers() { return this.isOwner || this.rank.canManageMembers; }
    // Permission: can edit details (change description and image)
    get canEditDetails() { return this.isOwner || this.rank.canEditDetails; }

    delete() {
        if (this.isOwner) this.group.ownerId = null;//return false;
        this.group.enmap.delete(this.group.id, `members.${this.id}`);
        return true;
    }

    static create(group, id) {
        group.enmap.set(group.id, {
            rankId: group.ranks.sort((a, b) => a.displayOrder - b.displayOrder)[0].id
        }, `members.${id}`);
    }
}

class Group {
    constructor(id, client, enmap) {
        this.id = id;
        this.client = client;
        this.enmap = enmap;
    }

    get ownerId() { return this.enmap.get(this.id, "ownerId"); }

    get name() { return this.enmap.get(this.id, "name"); }

    get description() { return this.enmap.get(this.id, "description"); }
    get shortDescription() { return this.enmap.get(this.id, "shortDescription"); }

    get color() { return this.enmap.get(this.id, "color"); }
    get displayImage() { return this.enmap.get(this.id, "displayImage"); }

    get invitedMembers() { return this.enmap.get(this.id, "invitedMembers"); }

    get rankIdCounter() { return this.enmap.get(this.id, "rankIdCounter"); }

    get creationTimestamp() { return this.enmap.get(this.id, "creationTimestamp"); }

    set ownerId(value) { this.enmap.set(this.id, value, "ownerId"); }

    set name(value) { this.enmap.set(this.id, value, "name"); }

    set description(value) { this.enmap.set(this.id, value, "description"); }
    set shortDescription(value) { this.enmap.set(this.id, value, "shortDescription"); }

    set color(value) { this.enmap.set(this.id, value, "color"); }
    set displayImage(value) { this.enmap.set(this.id, value, "displayImage"); }

    set rankIdCounter(value) { this.enmap.set(this.id, value, "rankIdCounter"); }

    get owner() {}

    get members() {}

    get ranks() {}

    getRank(id) {}

    getMember(userId) {}

    addMember(userId) {}

    addRank() {}

    inviteMember(userId) {
        if (this.getMember(userId)) return false;
        this.enmap.push(this.id, userId, "invitedMembers");
        return true;
    }
    uninviteMember(userId) {
        this.enmap.remove(this.id, userId, "invitedMembers");
    }

    static create(enmap, name, id) {
        enmap.set(id, {
            name,
            creationTimestamp: Math.floor(Date.now() / 1000),
            invitedMembers: [],
            members: {},
            ranks: {},
            rankIdCounter: 0
        });
    }
}

module.exports = {
    Group,
    GroupRank,
    GroupMember
}

module.exports.main = function(client) {}