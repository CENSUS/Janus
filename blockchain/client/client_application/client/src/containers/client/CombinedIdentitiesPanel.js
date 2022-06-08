import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import component from "../../components/modules/client/Attributes/CombinedIdentitiesPanel";
import {
  getCombinedIdentitiesRequest,
  deleteCombinedIdentityRequest,
  toggleCombinedIdentityRequest,
  userValidationRequest,
} from "../../redux/actions/ClientActions";

const mapStateToProps = (state) => {
  return {
    organizationsList: state.commonReducer.organizationsList,
    combinedIdentities: state.clientReducer.combinedIdentities,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      getCombinedIdentitiesRequest,
      deleteCombinedIdentityRequest,
      toggleCombinedIdentityRequest,
      userValidationRequest,
    },
    dispatch
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
