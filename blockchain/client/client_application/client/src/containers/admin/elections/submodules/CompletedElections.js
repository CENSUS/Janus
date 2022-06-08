import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import createLoadingSelector from "../../../helpers/createLoadingSelector";
import component from "../../../../components/modules/admin/submodules/CompletedElections";
import { syncWithBCStakeholderElectionsRequest } from "../../../../redux/actions/AdminActions";

const syncingStakeholderElections = createLoadingSelector([
    "SYNC_WITH_BC_STAKEH0LDER_ELECTIONS",
]);

const mapStateToProps = (state) => {
    return {
        syncingElections: syncingStakeholderElections(state.loadingReducer),
        elections: state.adminReducer.completedStakeholderElections,
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(
        {
            syncWithBCStakeholderElectionsRequest,
        },
        dispatch
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
