import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import createLoadingSelector from "../../helpers/createLoadingSelector";
import Data00Component from "../../../components/modules/client/RequestAccess/request_types/Data00";
import Data01Component from "../../../components/modules/client/RequestAccess/request_types/Data01";
import Data02Component from "../../../components/modules/client/RequestAccess/request_types/Data02";
import Data03Component from "../../../components/modules/client/RequestAccess/request_types/Data03";
import Data04Component from "../../../components/modules/client/RequestAccess/request_types/Data04";

import { requestAccessRequest } from "../../../redux/actions/ClientActions";

const loadingSelectorSubmitRequest = createLoadingSelector(["REQUEST_ACCESS"]);

const mapStateToProps = (state) => {
    return {
        organizationsList: state.commonReducer.organizationsList,
        isSubmittingRequest: loadingSelectorSubmitRequest(state.loadingReducer),
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({ requestAccessRequest }, dispatch);
};

export const Data00 = connect(
    mapStateToProps,
    mapDispatchToProps
)(Data00Component);

export const Data01 = connect(
    mapStateToProps,
    mapDispatchToProps
)(Data01Component);

export const Data02 = connect(
    mapStateToProps,
    mapDispatchToProps
)(Data02Component);

export const Data03 = connect(
    mapStateToProps,
    mapDispatchToProps
)(Data03Component);

export const Data04 = connect(
    mapStateToProps,
    mapDispatchToProps
)(Data04Component);
