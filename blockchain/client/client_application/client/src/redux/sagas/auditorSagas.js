import { takeLatest } from "redux-saga/effects";
import * as types from "../../utils/constants/auditorConstants";
import * as apis from "../../apis/auditorAPI";
import { composeHandlers } from "./sagasHandler";

export const auditorSagas = [
    takeLatest(
        types.RETRIEVE_LOG_INIT_REQUEST,
        composeHandlers({
            functionCall: apis.retrieveLogsInit,
        })
    ),
    takeLatest(
        types.RETRIEVE_LOGS_REQUEST,
        composeHandlers({
            functionCall: apis.retrieveLogs,
        })
    ),
    takeLatest(
        types.RETRIEVE_EXTRA_LOGS_REQUEST,
        composeHandlers({
            functionCall: apis.retrieveLogs,
        })
    ),
    takeLatest(
        types.SYNC_AUDITS_REQUEST,
        composeHandlers({
            functionCall: apis.syncAudits,
        })
    ),
];
