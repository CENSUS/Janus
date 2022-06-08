import { takeEvery, takeLatest } from "redux-saga/effects";
import * as types from "../../utils/constants/authConstants";
import * as apis from "../../apis/authAPI";
import { composeHandlers } from "./sagasHandler";

export const authSagas = [
  takeLatest(
    types.LOGIN_REQUEST,
    composeHandlers({
      functionCall: apis.loginUser,
    })
  ),
  takeEvery(
    types.USER_LOGOUT_REQUEST,
    composeHandlers({
      functionCall: apis.logoutUser,
    })
  ),
  takeLatest(
    types.LOGIN_WITH_VAULT_REQUEST,
    composeHandlers({
      functionCall: apis.loginWithVault,
    })
  ),
];
