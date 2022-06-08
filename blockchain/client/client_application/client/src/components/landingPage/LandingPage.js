import { useHistory, withRouter } from "react-router-dom";

const LandingPage = (props) => {
    const history = useHistory();
    const { isAuthenticated, user } = props.authReducer;
    const { GID, isAdmin, isCAAdmin, isAuditor } = user;

    if (!isAuthenticated) {
        history.push("/login");
    } else {
        if (GID) {
            history.push("/client/dashboard");
        } else if (isAdmin) {
            history.push("/admin/user-management");
        } else if (isCAAdmin) {
            history.push("/ca-admin/trust-anchors");
        } else if (isAuditor) {
            history.push("/auditor/audit");
        }
    }

    return <h1>Redirecting...</h1>;
};

export default withRouter(LandingPage);
