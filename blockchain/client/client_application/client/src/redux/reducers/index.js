import { combineReducers } from "redux";
import { routerReducer } from "react-router-redux";
import * as authConstants from "../../utils/constants/authConstants";
import commonReducer from "./common";
import authReducer from "./auth";
import clientReducer from "./client";
import adminReducer from "./admin";
import auditorReducer from "./auditor";
import {
    loadingReducer,
    errorReducer,
    notificationsReducer,
} from "./helperReducers";
import storage from "redux-persist/lib/storage";
const persistedStorageKeys = ["persist:clientReducer", "persist:commonReducer"];

const appReducer = combineReducers({
    routing: routerReducer,
    commonReducer,
    authReducer,
    adminReducer,
    auditorReducer,
    clientReducer,
    loadingReducer,
    errorReducer,
    notificationsReducer,
});

const rootReducer = (state, action) => {
    if (action.type === authConstants.USER_LOGOUT_SUCCESS) {
        persistedStorageKeys.forEach((key) => storage.removeItem(key));
        return appReducer(undefined, action);
    }
    return appReducer(state, action);
};

export default rootReducer;
