import App from "../App";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

const mapStateToProps = (state) => {
  return {
    authReducer: state.authReducer,
    //notificationsReducer: state.notificationsReducer,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({}, dispatch);
};

const Application = connect(mapStateToProps, mapDispatchToProps)(App);
export default Application;
