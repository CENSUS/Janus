import * as auditorConstants from "../../utils/constants/auditorConstants";

export const auditInitVoteRequest = (payload, callback) => ({
    type: auditorConstants.RETRIEVE_LOG_INIT_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const auditGetLogsRequest = (payload, callback) => ({
    type: auditorConstants.RETRIEVE_LOGS_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const auditGetExtraLogsRequest = (payload, callback) => ({
    type: auditorConstants.RETRIEVE_EXTRA_LOGS_REQUEST,
    payload,
    isAPI: true,
    callback,
});

export const syncAuditsRequest = (payload, callback) => ({
    type: auditorConstants.SYNC_AUDITS_REQUEST,
    payload,
    isAPI: true,
    callback,
});
