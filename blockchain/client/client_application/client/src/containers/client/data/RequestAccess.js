import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import component from "../../../components/modules/client/RequestAccess/RequestAccessForm";
import { requestAccessRequest } from "../../../redux/actions/ClientActions";
import { loadAvailableDataRequests } from "../../../utils/processors/data_processors";

const mapStateToProps = (state) => {
    return {
        availableDataRequests: loadAvailableDataRequests(),
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ requestAccessRequest }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
