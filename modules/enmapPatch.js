// Ash Public
// @.fuckme
// * This file is presented in its entire unmodified form.

// fixes stupid "enmap requires keys to be strings" errors like god i don't care
module.exports = class extends require("enmap") {
    get(key, ...args) {
        return super.get(key.toString(), ...args);
    }
    set(key, ...args) {
        return super.set(key.toString(), ...args);
    }
    push(key, ...args) {
        return super.push(key.toString(), ...args);
    }
    has(key, ...args) {
        return super.has(key.toString(), ...args);
    }
    delete(key, ...args) {
        return super.delete(key.toString(), ...args);
    }
    remove(key, ...args) {
        return super.remove(key.toString(), ...args);
    }
    ensure(key, defaultValue, path) {
        const data = this.get(key, path);
        if (data === undefined) this.set(key, defaultValue, path);
        return data === undefined ? defaultValue : data;
    }
}

module.exports.main = function() {}