import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import component from "../../components/common/Notifications";
import { updateNotifications } from "../../redux/actions/CommonActions";

const mapStateToProps = (state) => {
  return {
    notificationsReducer: state.notificationsReducer,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ updateNotifications }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
