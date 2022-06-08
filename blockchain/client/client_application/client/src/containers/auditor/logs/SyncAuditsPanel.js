import { bindActionCreators } from "redux";
import { connect } from "react-redux";
// import createLoadingSelector from "../../helpers/createLoadingSelector";
import component from "../../../components/modules/auditor/SyncAuditsPanel";
import { auditGetLogsRequest } from "../../../redux/actions/AuditorActions";

// const retrieveLogsSelector = createLoadingSelector(["SYNC_AUDITS"]);

const mapStateToProps = (state) => {
    return {
        retrieveLogsLoading: false,
        auditorAudits: state.auditorReducer.auditorAudits,
        currentAuditRequestID: state.auditorReducer.auditRequestID,
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ auditGetLogsRequest }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
