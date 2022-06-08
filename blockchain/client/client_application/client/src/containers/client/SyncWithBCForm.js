import component from "../../components/modules/client/Sync/SyncWithBCForm";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import createLoadingSelector from "../helpers/createLoadingSelector";
import { syncWithBCClientRequests } from "../../redux/actions/ClientActions";

const loadingSelector = createLoadingSelector(["SYNC_WITH_BC_CLIENT_REQUESTS"]);

const mapStateToProps = (state) => {
    return {
        isSyncing: loadingSelector(state.loadingReducer),
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ syncWithBCClientRequests }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
