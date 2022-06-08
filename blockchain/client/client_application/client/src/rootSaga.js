import { all } from "redux-saga/effects";
import { commonSagas } from "./redux/sagas/commonSagas";
import { authSagas } from "./redux/sagas/authSagas";
import { adminSagas } from "./redux/sagas/adminSagas";
import { auditorSagas } from "./redux/sagas/auditorSagas";
import { clientSagas } from "./redux/sagas/clientSagas";

const appSagas = [
    ...commonSagas,
    ...authSagas,
    ...adminSagas,
    ...auditorSagas,
    ...clientSagas,
];

export default function* root() {
    yield all(appSagas);
}
