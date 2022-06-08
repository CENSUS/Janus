import { bindActionCreators } from "redux";
import { connect } from "react-redux";
// import createLoadingSelector from "../../helpers/createLoadingSelector";
// import createErrorMessageSelector from "../../helpers/createErrorMessageSelector";
import component from "../../../components/modules/admin/RemoveCA";
import { removeCARequest } from "../../../redux/actions/AdminActions";

// const castingVoteSelector = createLoadingSelector(["CAST_BALLOT"]);
// const errorCastingVoteSelector = createErrorMessageSelector(["CAST_BALLOT"]);

const mapStateToProps = (state) => {
  return {
    // castingVoteLoading: castingVoteSelector(state.loadingReducer),
    // castingVoteErrors: errorCastingVoteSelector(state.loadingReducer),
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ removeCARequest }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
