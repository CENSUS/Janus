import component from "../../components/modules/client/Data/DataTable";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import createLoadingSelector from "../helpers/createLoadingSelector";
import { fullDecryptWithVaultRequest } from "../../redux/actions/ClientActions";

const loadingSelectorGetData = createLoadingSelector(["GET_DATA"]);
const loadingSelectorDecrypting = createLoadingSelector([
  "FULL_DECRYPT_WITH_VAULT",
]);

const mapStateToProps = (state) => {
  return {
    isLoadingData: loadingSelectorGetData(state.loadingReducer),
    isDecryptingData: loadingSelectorDecrypting(state.loadingReducer),
    data: state.clientReducer.requestData,
    user: state.authReducer.user,
    decryptionKeys: state.clientReducer.decryptionKeys,
    organizationsList: state.commonReducer.organizationsList,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fullDecryptWithVaultRequest }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
