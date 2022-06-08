import React, { Component } from "react";
import AppUtils from "../utils/AppUtils";
import { matchRoutes } from "react-router-config";
import { withRouter } from "react-router-dom";
import AppContext from "../context/AppContext";

class AppAuthorization extends Component {
    constructor(props, context) {
        super(props);
        const { routes } = context;
        this.state = {
            accessGranted: true,
            routes,
        };
    }

    componentDidMount() {
        if (!this.state.accessGranted) this.redirectRoute();
    }

    componentDidUpdate() {
        if (!this.state.accessGranted) this.redirectRoute();
    }

    static getDerivedStateFromProps(props, state) {
        const { location, userRole } = props;
        const { pathname } = location;
        const matched = matchRoutes(state.routes, pathname)[0];

        return {
            accessGranted: matched
                ? AppUtils.hasPermission(matched.route.auth, userRole)
                : true,
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.accessGranted !== this.state.accessGranted;
    }

    redirectRoute() {
        const { location, userRole, history } = this.props;
        const { pathname } = location;

        // const redirectUrl =
        //     state && state.redirectUrl ? state.redirectUrl : "/";
        if (!userRole || userRole.length === 0) {
            history.push({
                pathname: "/login",
                state: { redirectUrl: pathname },
            });
        } else {
            history.push({
                pathname: "/",
            });
        }
    }

    render() {
        return this.state.accessGranted ? (
            <React.Fragment>{this.props.children}</React.Fragment>
        ) : null;
    }
}

AppAuthorization.contextType = AppContext;

export default withRouter(AppAuthorization);
