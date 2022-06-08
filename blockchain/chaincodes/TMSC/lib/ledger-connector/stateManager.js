"use strict";

class StateManager {
    constructor(stateClass, key = undefined) {
        this.class = stateClass;
        this.key = key ? StateManager.makeKey(key) : null;
        this.currentState = null;
    }

    createKey(keyParts) {
        if (!this.key) this.key = StateManager.makeKey(keyParts);
    }

    getClass() {
        return this.class;
    }

    getKey() {
        return this.key;
    }

    getSplitKey() {
        return StateManager.splitKey(this.key);
    }

    getCurrentState() {
        return this.currentState;
    }

    serialize() {
        return StateManager.serialize(this);
    }

    static serialize(object) {
        return Buffer.from(JSON.stringify(object));
    }

    static deserialize(data, supportedClasses) {
        let json = JSON.parse(data.toString());
        let objClass = supportedClasses[json.class];
        if (!objClass) {
            throw new Error(`Unknown class of ${json.class}`);
        }
        let object = new objClass(json);

        return object;
    }

    static deserializeClass(data, objClass) {
        let json = JSON.parse(data.toString());
        let object = new objClass(json);
        return object;
    }

    static makeKey(keyParts) {
        return keyParts
            .map((part) =>
                typeof part !== "string" ? JSON.stringify(part) : part
            )
            .join(":");
    }

    static splitKey(key) {
        return key.split(":");
    }

    static prepareQueryKey(key) {
        return StateManager.splitKey(StateManager.makeKey(key));
    }
}

module.exports = StateManager;
