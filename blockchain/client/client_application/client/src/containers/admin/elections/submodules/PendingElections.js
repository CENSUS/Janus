import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import createLoadingSelector from "../../../helpers/createLoadingSelector";
import component from "../../../../components/modules/admin/submodules/PendingElections";
import {
    castBallotRequest,
    syncWithBCStakeholderElectionsRequest,
} from "../../../../redux/actions/AdminActions";

const syncingStakeholderElections = createLoadingSelector([
    "SYNC_WITH_BC_STAKEH0LDER_ELECTIONS",
]);
const castingBallotLoading = createLoadingSelector(["CAST_BALLOT"]);

const mapStateToProps = (state) => {
    return {
        syncingElections: syncingStakeholderElections(state.loadingReducer),
        castingBallotLoading: castingBallotLoading(state.loadingReducer),
        elections: state.adminReducer.pendingStakeholderElections,
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(
        { castBallotRequest, syncWithBCStakeholderElectionsRequest },
        dispatch
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
