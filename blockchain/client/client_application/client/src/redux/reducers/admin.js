import * as types from "../../utils/constants/adminConstants";

const INITIAL_STATE = {
    lastRegisteredUsers: [],
    electionsExist: false,
    completedStakeholderElections: [],
    pendingStakeholderElections: [],
    expiredStakeholderElections: [],
    electionsExtraInfo: {},
    usersToRegisterRegistry: [],
};

export default function adminReducer(state = INITIAL_STATE, { type, payload }) {
    switch (type) {
        case types.USER_REGISTER_REQUEST:
            return {
                ...state,
            };
        case types.USER_REGISTER_SUCCESS:
            return {
                ...state,
                lastRegisteredUsers: state.lastRegisteredUsers.concat(
                    payload.successfulEnrollments
                ),
            };
        case types.NEW_USER_REGISTER_REQUEST:
            return {
                ...state,
                usersToRegisterRegistry: [
                    ...state.usersToRegisterRegistry,
                    payload,
                ],
            };
        case types.CLEAR_SUCCESSFUL_REGISTRATIONS_REQUEST:
            return {
                ...state,
                lastRegisteredUsers: [],
            };
        case types.NEW_USER_REGISTER_REMOVE_REQUEST:
            const itemsToRemove = payload || [];
            return {
                ...state,
                usersToRegisterRegistry: state.usersToRegisterRegistry.filter(
                    (elem) => !itemsToRemove.includes(elem.enrollmentID)
                ),
            }; // Remove the user from the User Registry
        case types.SYNC_WITH_BC_STAKEH0LDER_ELECTIONS_SUCCESS:
            return {
                ...state,
                electionsExist: true,
                completedStakeholderElections: payload["completedElections"],
                pendingStakeholderElections: payload["pendingElections"],
                expiredStakeholderElections: payload["expiredElections"],
            };
        case types.SYNC_WITH_BC_ELECTION_EXTRA_INF0_SUCCESS:
            return {
                ...state,
                electionsExtraInfo: {
                    ...state.electionsExtraInfo,
                    ...payload,
                },
            };
        default:
            return state;
    }
}
