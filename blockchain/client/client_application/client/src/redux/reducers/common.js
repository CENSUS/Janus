import { fetchOrganizationsList } from "../../apis/commonAPI";
import * as types from "../../utils/constants/commonConstants";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const INITIAL_STATE = {
  organizationsList: fetchOrganizationsList(),
  syncedBCData: [],
};

function commonReducer(state = INITIAL_STATE, { type, payload }) {
  switch (type) {
    case types.FETCH_ORGANIZATIONS_LIST_SUCCESS:
      return {
        ...state,
        organizationsList: payload,
      };
    case types.SYNC_WITH_BC_SUCCESS:
      return { ...state, syncedBCData: payload };
    default:
      return state;
  }
}

const persistConfig = {
  key: "commonReducer",
  storage,
  whitelist: ["syncedBCData"],
};

export default persistReducer(persistConfig, commonReducer);
