"use strict";

module.exports = Object.freeze({
    dbc_api_address: process.env.DBC_API_HOSTNAME,
    dbc_api_port: process.env.DBC_API_PORT,
    vault_address: process.env.VAULT_ADDR,
    vault_port: process.env.VAULT_PORT,
    vault_login_endpoint: process.env.VAULT_LOGIN_ENDPOINT,
    vault_sys_decrypt_endpoint: process.env.VAULT_SYSTEM_DECRYPT_ENDPOINT,
    system_decryption_policy: process.env.SYSTEM_DECRYPTION_POLICY,
    vault_role: process.env.VAULT_ROLE,
    vault_token_check_refresh_every:
        process.env.VAULT_TOKEN_CHECK_TO_REFRESH_EVERY,
    vault_token_refresh_period: process.env.VAULT_TOKEN_REFRESH_PERIOD,
});
