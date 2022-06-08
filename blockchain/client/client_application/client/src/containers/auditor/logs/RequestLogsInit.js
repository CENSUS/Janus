import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import createLoadingSelector from "../../helpers/createLoadingSelector";
// import createErrorMessageSelector from "../../helpers/createErrorMessageSelector";
import component from "../../../components/modules/auditor/RequestLogsInit";
import { auditInitVoteRequest } from "../../../redux/actions/AuditorActions";

const requestLogsInitSelector = createLoadingSelector(["RETRIEVE_LOG_INIT"]);
// const errorCastingVoteSelector = createErrorMessageSelector(["CAST_BALLOT"]);

const mapStateToProps = (state) => {
    return {
        requestAccessLoading: requestLogsInitSelector(state.loadingReducer),
        // castingVoteErrors: errorCastingVoteSelector(state.loadingReducer),
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ auditInitVoteRequest }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
