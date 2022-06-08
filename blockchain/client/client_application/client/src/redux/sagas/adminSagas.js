import { takeLatest } from "redux-saga/effects";
import * as types from "../../utils/constants/adminConstants";
import * as apis from "../../apis/adminAPI";
import { composeHandlers } from "./sagasHandler";

export const adminSagas = [
    takeLatest(
        types.USER_REGISTER_REQUEST,
        composeHandlers({
            functionCall: apis.registerUser,
        })
    ),
    takeLatest(
        types.CAST_BALLOT_REQUEST,
        composeHandlers({
            functionCall: apis.vote,
        })
    ),
    takeLatest(
        types.UPDATE_TRUST_ANCHORS_REQUEST,
        composeHandlers({
            functionCall: apis.updateTrustAnchors,
        })
    ),
    takeLatest(
        types.ADD_CA_REQUEST,
        composeHandlers({
            functionCall: apis.addCA,
        })
    ),
    takeLatest(
        types.REMOVE_CA_REQUEST,
        composeHandlers({
            functionCall: apis.removeCA,
        })
    ),
    takeLatest(
        types.SYNC_WITH_BC_STAKEH0LDER_ELECTIONS_REQUEST,
        composeHandlers({
            functionCall: apis.syncWithBCStakeholderElections,
        })
    ),
    takeLatest(
        types.SYNC_WITH_BC_ELECTION_EXTRA_INF0_REQUEST,
        composeHandlers({
            functionCall: apis.syncWithBCelectionsExtraInfo,
        })
    ),
];
