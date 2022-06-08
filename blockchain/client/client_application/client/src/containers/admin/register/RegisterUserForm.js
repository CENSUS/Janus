import { bindActionCreators } from "redux";
import { connect } from "react-redux";
// import createLoadingSelector from "../../helpers/createLoadingSelector";
// import createErrorMessageSelector from "../../helpers/createErrorMessageSelector";
import component from "../../../components/modules/admin/RegisterUserForm";
import {
    appendToRegisterUserRegistryRequest,
    removeUserFromUserRegistryRequest,
} from "../../../redux/actions/AdminActions";

// const loadingSelector = createLoadingSelector(["USER_REGISTER"]);
// const errorSelector = createErrorMessageSelector(["USER_REGISTER"]);

const mapStateToProps = (state) => {
    return {};
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(
        {
            appendToRegisterUserRegistryRequest,
            removeUserFromUserRegistryRequest,
        },
        dispatch
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
