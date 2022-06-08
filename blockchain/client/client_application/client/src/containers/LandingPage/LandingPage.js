import LandingPage from "../../components/landingPage/LandingPage";
import { connect } from "react-redux";

const mapStateToProps = (state) => {
    return {
        authReducer: state.authReducer,
    };
};

export default connect(mapStateToProps, null)(LandingPage);
