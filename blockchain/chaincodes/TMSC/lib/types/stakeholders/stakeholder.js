"use strict";

const StateManager = require("../../ledger-connector/stateManager");
const { matchStrings } = require("../../utils/utils");
const constants = require("../../utils/constants");

class Stakeholder extends StateManager {
    constructor(object) {
        super(Stakeholder.getClass(), [object.domain]);
        Object.assign(this, object);
    }

    /**
     * Basic getters
     */
    getDomainType() {
        return this.domain;
    }

    getStakeholders() {
        return this.stakeholders;
    }

    getStakeholdersWithDetails() {
        return this;
    }

    async getStakeholderByName(ctx, stakeholderName) {
        if (this.domain !== constants.proxyStakeholders) {
            const stakeholdersKey = Stakeholder.makeKey([
                constants.proxyStakeholders,
            ]);
            const stakeholderInstance = await ctx.stakeholderManager.get(
                stakeholdersKey
            );
            const stakeholderKey = Object.keys(
                stakeholderInstance.stakeholders
            ).find((stateStakeholder) =>
                matchStrings(
                    stakeholderName,
                    stakeholderInstance.stakeholders[stateStakeholder].name
                )
            );

            return stakeholderInstance.stakeholders[stakeholderKey];
        } else {
            const stakeholderKey = Object.keys(this.stakeholders).find(
                (stateStakeholder) =>
                    matchStrings(
                        stakeholderName,
                        this.stakeholders[stateStakeholder].name
                    )
            );
            return this.stakeholders[stakeholderKey];
        }
    }

    async getMSPDomain(ctx, mspID) {
        if (this.domain !== constants.proxyStakeholders) {
            const stakeholdersKey = Stakeholder.makeKey([
                constants.proxyStakeholders,
            ]);
            const stakeholderInstance = await ctx.stakeholderManager.get(
                stakeholdersKey
            );
            const stakeholderKey = Object.keys(
                stakeholderInstance.stakeholders
            ).find((stateStakeholder) =>
                matchStrings(
                    mspID,
                    stakeholderInstance.stakeholders[stateStakeholder].msp
                )
            );
            return stakeholderInstance.stakeholders[stakeholderKey].domain;
        } else {
            const stakeholderKey = Object.keys(this.stakeholders).find(
                (stateStakeholder) =>
                    matchStrings(mspID, this.stakeholders[stateStakeholder].msp)
            );
            return this.stakeholders[stakeholderKey].domain;
        }
    }

    /**
     * Basic setters
     */

    setDomainType(domain) {
        this.domain = domain;
    }

    // Use with caution
    setStakeholders(_stakeholders) {
        this.stakeholders = _stakeholders;
    }

    setRevoked(stakeholder, revokeValue) {
        Object.keys(this.stakeholders).forEach((stateStakeholder) => {
            if (matchStrings(stakeholder, stateStakeholder))
                this.stakeholders[stateStakeholder].isRevoked = revokeValue;
        });
    }

    addStakeholderToStakeholders(stakeholder, data) {
        stakeholder = stakeholder.toUpperCase();

        if (!("name" in data || "msp" in data))
            throw new Error("Insufficient stakeholder information");

        if (this.domain === constants.proxyStakeholders) {
            if (!("domain" in data))
                throw new Error("Insufficient stakeholder information");

            data.domain = data.domain.toUpperCase();
        }

        this.stakeholders[stakeholder] = data;
    }

    /**
     *
     * Various
     */

    checkIfRevokedStakeholder(mspId) {
        const { isRevoked = false } = Object.values(this.stakeholders).find(
            (stateStakeholder) => matchStrings(mspId, stateStakeholder.msp)
        );

        return isRevoked;
    }

    getStakeholderDetails(stakeholder) {
        const stakeholderKey = Object.keys(this.stakeholders).find(
            (stateStakeholder) => matchStrings(stakeholder, stateStakeholder)
        );
        return this.stakeholders[stakeholderKey];
    }

    isKnownStakeholder(stakeholder) {
        return Object.values(this.stakeholders).some((stateStakeholder) =>
            matchStrings(stakeholder, stateStakeholder.name)
        );
    }

    async stakeholderIsInvokerStakeholder(ctx, mspID, stakeholder) {
        let stakeholderDetails = null;
        if (this.domain !== constants.proxyStakeholders) {
            const stakeholdersKey = Stakeholder.makeKey([
                constants.proxyStakeholders,
            ]);
            const stakeholderInstance = await ctx.stakeholderManager.get(
                stakeholdersKey
            );
            stakeholderDetails =
                stakeholderInstance.getStakeholderDetails(stakeholder);
        } else {
            stakeholderDetails = this.getStakeholderDetails(stakeholder);
        }
        if (!stakeholderDetails) return false;
        return matchStrings(mspID, stakeholderDetails.msp);
    }

    removeStakeholderFromStakeholders(stakeholder) {
        this.stakeholders = Object.keys(this.stakeholders)
            .filter(
                (stateStakeholder) =>
                    !matchStrings(
                        stakeholder,
                        this.stakeholders[stateStakeholder].name
                    )
            )
            .reduce(
                (res, key) => ((res[key] = this.stakeholders[key]), res),
                {}
            );
    }

    removeRevokedStakeholdersFromList(stakeholdersList) {
        return Object.keys(stakeholdersList)
            .filter((stakeholder) => !stakeholdersList[stakeholder].isRevoked)
            .reduce(
                (res, key) => ((res[key] = stakeholdersList[key]), res),
                {}
            );
    }

    /**
     * `createInstance` is a `factory` method that creates Stakeholder objects
     */
    static createInstance(domain, stakeholders) {
        domain = domain.toUpperCase();
        return new Stakeholder({ domain, stakeholders });
    }

    static getClass() {
        return "stakeholderinfo";
    }
}
module.exports = Stakeholder;
