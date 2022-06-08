import component from "../../components/modules/client/Attributes/CombineIdentity";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import createLoadingSelector from "../helpers/createLoadingSelector";
import { combineIdentitiesRequest } from "../../redux/actions/ClientActions";

const loadingSelectorLogin = createLoadingSelector(["COMBINE_IDENTITIES"]);

const mapStateToProps = (state) => {
    return {
        organizationsList: state.commonReducer.organizationsList,

        isCombining: loadingSelectorLogin(state.loadingReducer),
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ combineIdentitiesRequest }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
