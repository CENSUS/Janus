import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import createLoadingSelector from "../../helpers/createLoadingSelector";
import { auditGetExtraLogsRequest } from "../../../redux/actions/AuditorActions";
import component from "../../../components/modules/auditor/LogsVisualizer";

const requestLogsInitSelector = createLoadingSelector(["RETRIEVE_LOGS"]);

const mapStateToProps = (state) => {
    return {
        requestAccessLoading: requestLogsInitSelector(state.loadingReducer),
        auditRequestID: state.auditorReducer.auditRequestID,
        logsType: state.auditorReducer.logsType,
        nextAuditLogs: state.auditorReducer.nextAuditLogs,
        metadata: state.auditorReducer.metadata,
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ auditGetExtraLogsRequest }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
