import * as adminConstants from "../../utils/constants/adminConstants";

export const registerUserRequest = (payload, callback) => ({
    type: adminConstants.USER_REGISTER_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const appendToRegisterUserRegistryRequest = (payload, callback) => ({
    type: adminConstants.NEW_USER_REGISTER_REQUEST,
    payload,
    isAPI: false,
    callback,
});

export const removeUserFromUserRegistryRequest = (payload, callback) => ({
    type: adminConstants.NEW_USER_REGISTER_REMOVE_REQUEST,
    payload,
    isAPI: false,
    callback,
});

export const clearSuccessfulRegsRequest = (payload, callback) => ({
    type: adminConstants.CLEAR_SUCCESSFUL_REGISTRATIONS_REQUEST,
    payload,
    isAPI: false,
    callback,
});

export const castBallotRequest = (payload, callback) => ({
    type: adminConstants.CAST_BALLOT_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const updateTrustAnchorsRequest = (payload, callback) => ({
    type: adminConstants.UPDATE_TRUST_ANCHORS_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const addCARequest = (payload, callback) => ({
    type: adminConstants.ADD_CA_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const removeCARequest = (payload, callback) => ({
    type: adminConstants.REMOVE_CA_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const syncWithBCStakeholderElectionsRequest = (payload, callback) => ({
    type: adminConstants.SYNC_WITH_BC_STAKEH0LDER_ELECTIONS_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const syncWithBCElectionsExtraInfoRequest = (payload, callback) => ({
    type: adminConstants.SYNC_WITH_BC_ELECTION_EXTRA_INF0_REQUEST,
    payload,
    isAPI: true,
    callback,
});
