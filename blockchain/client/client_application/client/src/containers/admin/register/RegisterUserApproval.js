import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import createLoadingSelector from "../../helpers/createLoadingSelector";
// import createErrorMessageSelector from "../../helpers/createErrorMessageSelector";
import component from "../../../components/modules/admin/RegisterUserSubmitPanel";
import {
    registerUserRequest,
    removeUserFromUserRegistryRequest,
    clearSuccessfulRegsRequest,
} from "../../../redux/actions/AdminActions";

const isRegisteringUsersLoading = createLoadingSelector(["USER_REGISTER"]);
// const errorSelector = createErrorMessageSelector(["USER_REGISTER"]);

const mapStateToProps = (state) => {
    return {
        isRegisteringUsers: isRegisteringUsersLoading(state.loadingReducer),
        usersToRegisterRegistry: state.adminReducer.usersToRegisterRegistry,
        lastRegisteredUsers: state.adminReducer.lastRegisteredUsers,
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(
        {
            registerUserRequest,
            removeUserFromUserRegistryRequest,
            clearSuccessfulRegsRequest,
        },
        dispatch
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
