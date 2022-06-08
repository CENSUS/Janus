import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import component from "../../../components/modules/modals/ElectionsExtraInfo";
import { syncWithBCElectionsExtraInfoRequest } from "../../../redux/actions/AdminActions";

const mapStateToProps = (state) => {
    return {
        electionsExtraInfo: state.adminReducer.electionsExtraInfo,
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(
        { syncWithBCElectionsExtraInfoRequest },
        dispatch
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
