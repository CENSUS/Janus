import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import component from "../../components/modules/client/Attributes/ActiveIdentitiesList";
import createLoadingSelector from "../helpers/createLoadingSelector";
import {
    getCombinedIdentitiesRequest,
    toggleCombinedIdentityRequest,
} from "../../redux/actions/ClientActions";

const loadingSelectorRefreshing = createLoadingSelector([
    "GET_COMBINED_IDENTITIES",
]);

const mapStateToProps = (state) => {
    return {
        organizationsList: state.commonReducer.organizationsList,
        combinedIdentities: state.clientReducer.combinedIdentities,
        isRefreshingIdentities: loadingSelectorRefreshing(state.loadingReducer),
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(
        {
            getCombinedIdentitiesRequest,
            toggleCombinedIdentityRequest,
        },
        dispatch
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
