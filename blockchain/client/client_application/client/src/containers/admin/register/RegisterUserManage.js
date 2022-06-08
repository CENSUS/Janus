import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import component from "../../../components/admin/UsersManage";

const mapStateToProps = (state) => {
  return {};
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({}, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(component);
