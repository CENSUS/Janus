import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import createLoadingSelector from "../../helpers/createLoadingSelector";
import component from "../../../components/modules/admin/Elections";
import {
    castBallotRequest,
    syncWithBCStakeholderElectionsRequest,
} from "../../../redux/actions/AdminActions";
const isLoading = createLoadingSelector(["SYNC_WITH_BC_STAKEH0LDER_ELECTIONS"]);

const mapStateToProps = (state) => {
    return {
        isRefreshingElections: isLoading(state.loadingReducer),
        electionsExist: state.adminReducer.electionsExist,
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(
        { castBallotRequest, syncWithBCStakeholderElectionsRequest },
        dispatch
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
