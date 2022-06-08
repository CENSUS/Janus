import * as types from "../../utils/constants/clientConstants";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const INITIAL_STATE = {
    combinedIdentities: null,
    validatedUser: {},
    requestData: {},
    decryptionKeys: null,
    selectedRequestID: null,
    syncedBCData: [],
    nextSyncedBCData: [],
    responseMetadata: {},
    reinitialize: false,
};

function clientReducer(state = INITIAL_STATE, { type, payload }) {
    switch (type) {
        case types.SYNC_WITH_BC_CLIENT_EXTRA_REQUESTS_REQUEST:
            return {
                ...state,
                nextSyncedBCData: INITIAL_STATE.nextSyncedBCData,
            };
        case types.SYNC_WITH_BC_CLIENT_EXTRA_REQUESTS_SUCCESS:
            return {
                ...state,
                syncedBCData: [...state.syncedBCData, ...payload.recordsData],
                nextSyncedBCData: payload.recordsData,
                responseMetadata: payload.metadata,
            };
        case types.SYNC_WITH_BC_CLIENT_REQUESTS_REQUEST:
            return {
                ...state,
                reinitialize: true,
                syncedBCData: INITIAL_STATE.syncedBCData,
                nextSyncedBCData: INITIAL_STATE.nextSyncedBCData,
                responseMetadata: INITIAL_STATE.responseMetadata,
            };
        case types.SYNC_WITH_BC_CLIENT_REQUESTS_SUCCESS:
            return {
                ...state,
                reinitialize: INITIAL_STATE.reinitialize,
                syncedBCData: payload.recordsData,
                nextSyncedBCData: payload.recordsData,
                responseMetadata: payload.metadata,
            };
        case types.GET_COMBINED_IDENTITIES_SUCCESS:
            return { ...state, combinedIdentities: payload };
        case types.COMBINE_IDENTITIES_SUCCESS:
            return {
                ...state,
                combinedIdentities: {
                    ...state.combinedIdentities,
                    [payload.organization]: [
                        ...(state.combinedIdentities[payload.organization]
                            ? state.combinedIdentities[
                                  payload.organization
                              ].find(
                                  (user) => user.username === payload.username
                              )
                                ? [
                                      ...state.combinedIdentities[
                                          payload.organization
                                      ],
                                  ]
                                : [
                                      ...state.combinedIdentities[
                                          payload.organization
                                      ],
                                      {
                                          username: payload.username,
                                          isActive: payload.isActive,
                                      },
                                  ]
                            : [
                                  {
                                      username: payload.username,
                                      isActive: payload.isActive,
                                  },
                              ]),
                    ],
                },
            };
        case types.DELETE_COMBINED_IDENTITY_SUCCESS:
            return {
                ...state,
                combinedIdentities:
                    Object.values(
                        state.combinedIdentities[payload.organization]
                    ).length <= 1
                        ? {
                              ...Object.keys(state.combinedIdentities)
                                  .filter(
                                      (organization) =>
                                          organization !== payload.organization
                                  )
                                  .reduce((obj, key) => {
                                      obj[key] = state.combinedIdentities[key];
                                      return obj;
                                  }, {}),
                          }
                        : {
                              ...state.combinedIdentities,
                              [payload.organization]: Object.values(
                                  state.combinedIdentities[payload.organization]
                              ).filter(
                                  (user) => user.username !== payload.username
                              ),
                          },
            };
        case types.TOGGLE_COMBINED_IDENTITY_SUCCESS:
            const { organization, username } = payload;
            return {
                ...state,
                combinedIdentities: {
                    ...state.combinedIdentities,
                    [organization]: state.combinedIdentities[organization].map(
                        (user) =>
                            user.username !== username
                                ? user
                                : {
                                      username: username,
                                      isActive: !user.isActive,
                                  }
                    ),
                },
            };
        case types.USER_VALIDATION_SUCCESS:
            return { ...state, validatedUser: payload };
        case types.GET_DATA_FAILURE:
            return {
                ...state,
                selectedRequestID: INITIAL_STATE.selectedRequestID,
            };
        case types.GET_DATA_REQUEST:
            return {
                ...state,
                selectedRequestID: payload.requestID,
                requestData: {},
                decryptionKeys: null,
            };
        case types.GET_DATA_SUCCESS:
            return { ...state, requestData: payload };
        case types.FULL_DECRYPT_WITH_VAULT_SUCCESS:
            return { ...state, decryptionKeys: payload };
        default:
            return state;
    }
}

const persistConfig = {
    key: "clientReducer",
    storage,
    whitelist: [
        "combinedIdentities",
        "validatedUser",
        "requestData",
        "syncedBCData",
        "responseMetadata",
    ],
};

export default persistReducer(persistConfig, clientReducer);
