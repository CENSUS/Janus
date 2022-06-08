import * as types from "../../utils/constants/auditorConstants";

const INITIAL_STATE = {
    auditorAudits: [],
    logsType: null,
    auditRequestID: undefined,
    auditLogs: [],
    nextAuditLogs: [],
    metadata: {},
};

export default function auditorReducer(
    state = INITIAL_STATE,
    { type, payload }
) {
    switch (type) {
        case types.RETRIEVE_LOGS_REQUEST:
            let updatedState = {};
            if (state.auditRequestID !== payload.requestData.requestID) {
                updatedState = {
                    logsType: INITIAL_STATE.logsType,
                    auditRequestID: payload.requestData.requestID,
                    auditLogs: INITIAL_STATE.auditLogs,
                    nextAuditLogs: INITIAL_STATE.nextAuditLogs,
                    metadata: INITIAL_STATE.metadata,
                };
            }
            return { ...state, ...updatedState };
        case types.RETRIEVE_LOGS_SUCCESS:
            return {
                ...state,
                logsType: payload.type,
                auditLogs: payload.logs,
                nextAuditLogs: payload.logs,
                metadata: payload.responseMetadata,
            };
        case types.RETRIEVE_EXTRA_LOGS_SUCCESS:
            return {
                ...state,
                auditLogs: [...state.auditLogs, ...payload.logs],
                nextAuditLogs: payload.logs,
                metadata: payload.responseMetadata,
            };
        case types.SYNC_AUDITS_SUCCESS:
            return { ...state, auditorAudits: payload };
        default:
            return state;
    }
}
