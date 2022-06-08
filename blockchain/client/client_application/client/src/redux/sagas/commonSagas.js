import { takeLatest } from "redux-saga/effects";
import * as types from "../../utils/constants/commonConstants";
import * as apis from "../../apis/commonAPI";
import { composeHandlers } from "./sagasHandler";

export const commonSagas = [
  takeLatest(
    types.FETCH_ORGANIZATIONS_LIST_REQUEST,
    composeHandlers({
      functionCall: apis.fetchOrganizationsList,
    })
  ),
  takeLatest(
    types.SYNC_WITH_BC_REQUEST,
    composeHandlers({
      functionCall: apis.syncWithBC,
    })
  ),
];
