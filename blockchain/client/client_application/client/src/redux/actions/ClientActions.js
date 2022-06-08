import * as clientConstants from "../../utils/constants/clientConstants";

export const requestAccessRequest = (payload, callback) => ({
    type: clientConstants.REQUEST_ACCESS_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const syncWithBCClientRequests = (payload, callback) => ({
    type: clientConstants.SYNC_WITH_BC_CLIENT_REQUESTS_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const syncWithBCClientExtraRequests = (payload, callback) => ({
    type: clientConstants.SYNC_WITH_BC_CLIENT_EXTRA_REQUESTS_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const getCombinedIdentitiesRequest = (payload, callback) => ({
    type: clientConstants.GET_COMBINED_IDENTITIES_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const combineIdentitiesRequest = (payload, callback) => ({
    type: clientConstants.COMBINE_IDENTITIES_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const deleteCombinedIdentityRequest = (payload, callback) => ({
    type: clientConstants.DELETE_COMBINED_IDENTITY_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const toggleCombinedIdentityRequest = (payload, callback) => ({
    type: clientConstants.TOGGLE_COMBINED_IDENTITY_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const userValidationRequest = (payload, callback) => ({
    type: clientConstants.USER_VALIDATION_REQUEST,
    payload,
    isAPI: false,
    callback,
});

export const getDataRequest = (payload, callback) => ({
    type: clientConstants.GET_DATA_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const fullDecryptWithVaultRequest = (payload, callback) => ({
    type: clientConstants.FULL_DECRYPT_WITH_VAULT_REQUEST,
    payload,
    isAPI: false,
    callback,
});
