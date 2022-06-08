import { takeLatest, takeEvery } from "redux-saga/effects";
import * as types from "../../utils/constants/clientConstants";
import * as apis from "../../apis/clientAPI";
import { composeHandlers } from "./sagasHandler";

export const clientSagas = [
    takeLatest(
        types.REQUEST_ACCESS_REQUEST,
        composeHandlers({
            functionCall: apis.requestAccess,
        })
    ),
    takeLatest(
        types.SYNC_WITH_BC_CLIENT_REQUESTS_REQUEST,
        composeHandlers({
            functionCall: apis.syncWithBCClientsRequests,
        })
    ),
    takeLatest(
        types.SYNC_WITH_BC_CLIENT_EXTRA_REQUESTS_REQUEST,
        composeHandlers({
            functionCall: apis.syncWithBCClientsRequests,
        })
    ),
    takeLatest(
        types.GET_COMBINED_IDENTITIES_REQUEST,
        composeHandlers({
            functionCall: apis.getCombinedIdentities,
        })
    ),
    takeLatest(
        types.COMBINE_IDENTITIES_REQUEST,
        composeHandlers({
            functionCall: apis.combineIdentities,
        })
    ),
    takeLatest(
        types.DELETE_COMBINED_IDENTITY_REQUEST,
        composeHandlers({
            functionCall: apis.removeCombinedIdentity,
        })
    ),
    takeEvery(
        types.TOGGLE_COMBINED_IDENTITY_REQUEST,
        composeHandlers({
            functionCall: apis.toggleCombinedIdentity,
        })
    ),
    takeLatest(
        types.USER_VALIDATION_REQUEST,
        composeHandlers({
            functionCall: apis.userValidation,
        })
    ),
    takeLatest(
        types.GET_DATA_REQUEST,
        composeHandlers({
            functionCall: apis.getData,
        })
    ),
    takeLatest(
        types.FULL_DECRYPT_WITH_VAULT_REQUEST,
        composeHandlers({
            functionCall: apis.fullDecryptWithVault,
        })
    ),
];
