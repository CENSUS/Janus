import component from "../../components/modules/common/VaultLogin";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { loginWithVaultRequest } from "../../redux/actions/AuthActions";
import createLoadingSelector from "../helpers/createLoadingSelector";

const loadingSelectorLogin = createLoadingSelector(["LOGIN_WITH_VAULT"]);

const mapStateToProps = (state) => {
    return {
        isLoggingInVault: loadingSelectorLogin(state.loadingReducer),
        isAuthenticatedVault: state.authReducer.isAuthenticatedVault,
        vaultUsername: state.authReducer.vaultUsername,
        userOrganization: state.authReducer.user.organization,
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ loginWithVaultRequest }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
