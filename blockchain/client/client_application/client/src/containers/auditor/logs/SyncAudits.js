import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import createLoadingSelector from "../../helpers/createLoadingSelector";
// import createErrorMessageSelector from "../../helpers/createErrorMessageSelector";
import component from "../../../components/modules/auditor/SyncAudits";
import { syncAuditsRequest } from "../../../redux/actions/AuditorActions";

const syncAuditsSelector = createLoadingSelector(["SYNC_AUDITS"]);
// const errorCastingVoteSelector = createErrorMessageSelector(["CAST_BALLOT"]);

const mapStateToProps = (state) => {
    return {
        syncAuditsLoading: syncAuditsSelector(state.loadingReducer),
        // castingVoteErrors: errorCastingVoteSelector(state.loadingReducer),
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ syncAuditsRequest }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
