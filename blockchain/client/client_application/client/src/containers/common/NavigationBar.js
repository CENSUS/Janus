import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { logoutUserRequest } from "../../redux/actions/AuthActions";
import createLoadingSelector from "../helpers/createLoadingSelector";
import NavigationBar from "../../components/common/NavigationBar";

const loadingSelectorLogout = createLoadingSelector(["USER_LOGOUT"]);

const mapStateToProps = (state) => {
  return {
    isLoggingOut: loadingSelectorLogout(state.loadingReducer),
    authReducer: state.authReducer,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ logoutUserRequest }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(NavigationBar);
