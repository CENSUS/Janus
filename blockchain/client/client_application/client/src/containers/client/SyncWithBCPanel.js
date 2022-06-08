import component from "../../components/modules/client/Sync/SyncWithBCPanel";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import createLoadingSelector from "../helpers/createLoadingSelector";
import {
    syncWithBCClientExtraRequests,
    getDataRequest,
} from "../../redux/actions/ClientActions";

const loadingSelector = createLoadingSelector([
    "SYNC_WITH_BC_CLIENT_EXTRA_REQUESTS",
]);

const mapStateToProps = (state) => {
    return {
        isSyncing: loadingSelector(state.loadingReducer),
        syncedBCData: state.clientReducer.syncedBCData,
        nextSyncedBCData: state.clientReducer.nextSyncedBCData,
        selectedRequestID: state.clientReducer.selectedRequestID,
        metadata: state.clientReducer.responseMetadata,
        reinitialize: state.clientReducer.reinitialize,
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(
        { syncWithBCClientExtraRequests, getDataRequest },
        dispatch
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
