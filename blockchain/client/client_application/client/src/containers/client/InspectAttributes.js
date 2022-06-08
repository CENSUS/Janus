import component from "../../components/modules/client/Attributes/InspectAttributes";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
// import createLoadingSelector from "../helpers/createLoadingSelector";

// const loadingSelectorLogin = createLoadingSelector(["COMBINE_IDENTITIES"]);
// const errorSelectorLogin = createErrorMessageSelector(["COMBINE_IDENTITIES"]);

const mapStateToProps = (state) => {
  return {
    organizationsList: state.commonReducer.organizationsList,
    validatedUserData: state.clientReducer.validatedUser,
    // isCombining: loadingSelectorLogin(state.loadingReducer),
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({}, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
