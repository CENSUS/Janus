import component from "../../components/modules/common/Login";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { loginUserRequest } from "../../redux/actions/AuthActions";
import createLoadingSelector from "../helpers/createLoadingSelector";
import createErrorMessageSelector from "../helpers/createErrorMessageSelector";

const loadingSelectorLogin = createLoadingSelector(["LOGIN"]);
const errorSelectorLogin = createErrorMessageSelector(["LOGIN"]);

const mapStateToProps = (state) => {
  return {
    organizationsList: state.commonReducer.organizationsList,
    token: state.authReducer.token,
    refreshToken: state.authReducer.refreshToken,
    successLogin: state.authReducer.successLogin,
    hasErrorLoginMessage: state.authReducer.hasErrorLoginMessage,
    errorMessage: state.authReducer.errorMessage,

    isFetchingLogin: loadingSelectorLogin(state.loadingReducer),
    errors: errorSelectorLogin(state.errorReducer),
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ loginUserRequest }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
