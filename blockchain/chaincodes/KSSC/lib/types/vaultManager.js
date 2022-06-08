"use strict";
const { authenticateWithVault } = require("../helper");
const { delay } = require("../utils/utils");
const {
    vault_token_check_refresh_every,
    vault_token_refresh_period,
} = require("../utils/values");
const styles = require("./indicators");
const CHECK_TO_REFRESH_TOKEN_EVERY = vault_token_check_refresh_every * 60000; // S to MS
const CHECK_IF_TO_REFRESH_TOKEN_EVERY = vault_token_refresh_period * 60000; // S to MS

const msgLogger = (style, msg) =>
    console.log(style, `[Vault Manager] - ${msg}`);

class VaultManager {
    constructor() {
        this.vaultToken = { token: null, lastTokenRefresh: null };
    }

    init() {
        this.#refresh_token();
    }

    getToken() {
        return this.vaultToken.token;
    }

    async #refresh_token() {
        const currentTime = Date.now();
        msgLogger(
            styles.CYAN,
            "Checking if the Vault Token needs to be refreshed..."
        );
        if (
            currentTime - this.vaultToken.lastTokenRefresh >=
            CHECK_IF_TO_REFRESH_TOKEN_EVERY
        ) {
            msgLogger(
                styles.YELLOW,
                "Token needs to be refreshed. Refreshing the Vault token..."
            );
            const { token, refreshTime, availableToken } =
                await authenticateWithVault();

            if (availableToken) {
                this.vaultToken = { token, lastTokenRefresh: refreshTime };
                msgLogger(
                    styles.GREEN,
                    "Successfully refreshed the Vault Token."
                );
            } else {
                await delay(Math.floor(Math.random() * (6000 - 3000) + 3000));
                await this.#refresh_token();
                return;
            }
        } else {
            msgLogger(
                styles.GREEN,
                `Vault Token does not need to be refreshed! Refresh period: ${
                    CHECK_IF_TO_REFRESH_TOKEN_EVERY / 60000
                } minutes`
            );
        }
        setTimeout(
            this.#refresh_token.bind(this),
            CHECK_TO_REFRESH_TOKEN_EVERY
        );
    }
}

module.exports = VaultManager;
