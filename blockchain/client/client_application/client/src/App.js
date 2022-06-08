import React, { Fragment, Suspense, Component } from "react";
import "./App.css";
import { Switch, HashRouter } from "react-router-dom";
import {
    MuiThemeProvider,
    CssBaseline,
    Typography,
    Box,
} from "@material-ui/core";
import routes from "./app-configs/routesConfig";
import theme from "./theme";
import GlobalStyles from "./GlobalStyles";
import AppContext from "./context/AppContext";
import AppAuthorization from "./auth/AppAuthorization";
import { renderRoutes } from "react-router-config";
import NavigationBar from "./containers/common/NavigationBar";
import Notifications from "./containers/common/Notifications";
import config from "./config";
import { history } from "./store";

const getRole = (user) => {
    if (user.GID) {
        return "client";
    } else if (user.isAdmin || user.isCAAdmin) {
        if (user.isCAAdmin) return "caAdmin";
        return "admin";
    } else if (user.isAuditor) {
        return "auditor";
    }
};

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            authReducer: {
                isAuthenticated: props.authReducer.isAuthenticated,
                GID: props.authReducer.user.GID,
                isAdmin: props.authReducer.user.isAdmin,
                isCAAdmin: props.authReducer.user.isCAAdmin,
                isAuditor: props.authReducer.user.isAuditor,
                role: getRole(props.authReducer.user),
                lastUpdated: props.authReducer.lastUpdated,
            },
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.authReducer.isAuthenticated !==
            this.state.authReducer.isAuthenticated
        );
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (
            prevState.authReducer.lastUpdated <
            nextProps.authReducer.lastUpdated
        ) {
            const user = nextProps.authReducer.user;
            return {
                authReducer: {
                    isAuthenticated: nextProps.authReducer.isAuthenticated,
                    GID: user ? nextProps.authReducer.user.GID : undefined,
                    isAdmin: user
                        ? nextProps.authReducer.user.isAdmin
                        : undefined,
                    isCAAdmin: user
                        ? nextProps.authReducer.user.isCAAdmin
                        : undefined,
                    isAuditor: user
                        ? nextProps.authReducer.user.isAuditor
                        : undefined,
                    role: user ? getRole(user) : undefined,
                    lastUpdated: nextProps.authReducer.lastUpdated,
                },
            };
        }
        return null;
    }

    render() {
        return (
            <MuiThemeProvider theme={theme}>
                <React.Fragment>
                    <HashRouter history={history} basename={config.baseUrl}>
                        <AppContext.Provider value={{ routes }}>
                            <CssBaseline />
                            <GlobalStyles />
                            <Notifications />
                            <div className="App">
                                <AppAuthorization
                                    userRole={this.state.authReducer.role}
                                >
                                    <NavigationBar />
                                    <Suspense fallback={<Fragment />}>
                                        <div
                                            className="App-main-components"
                                            style={{
                                                backgroundColor:
                                                    theme.palette.secondary
                                                        .main,
                                            }}
                                        >
                                            <Switch>
                                                {renderRoutes(routes)}
                                            </Switch>
                                        </div>
                                    </Suspense>
                                </AppAuthorization>
                            </div>
                            <Box pt={4}>
                                <Copyright />
                            </Box>
                        </AppContext.Provider>
                    </HashRouter>
                </React.Fragment>
            </MuiThemeProvider>
        );
    }
}

function Copyright() {
    return (
        <Typography variant="body2" color="primary" align="center">
            {"Copyright © Ministry of Health"} {new Date().getFullYear()}
        </Typography>
    );
}
