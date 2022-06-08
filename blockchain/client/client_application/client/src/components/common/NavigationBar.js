import React from "react";
import { makeStyles } from "@material-ui/core";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";

import {
    AdminHomePageConfig,
    CAAdminHomePageConfig,
} from "../admin/AdminPageConfig";
import { AuditorHomePageConfig } from "../auditor/AuditorPageConfig";
import { ClientHomePageConfig } from "../client/ClientPageConfig";
import { NavLink, withRouter } from "react-router-dom";

const AdminRoutes = AdminHomePageConfig.routes;
const CAAdminRoutes = CAAdminHomePageConfig.routes;
const AuditorRoutes = AuditorHomePageConfig.routes;
const ClientRoutes = ClientHomePageConfig.routes;

const useStyles = makeStyles((theme) => ({
    toolbar: {
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.common.white,
    },
    toolbarTitle: {
        flex: 1,
    },
    toolbarSecondary: {
        justifyContent: "center",
        overflowX: "auto",
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    toolbarHelper: {
        justifyContent: "center",
        minHeight: "10px",
        overflowX: "auto",
        color: theme.palette.common.darkGray,
        backgroundColor: theme.palette.common.softGray,
    },
    toolbarLink: {
        color: theme.palette.common.white,
        textDecoration: "none",
        padding: theme.spacing(1),
        flexShrink: 0,
    },
}));

const defineUserType = (user) => {
    if (user.GID) {
        return "CLIENT";
    } else if (user.isAdmin) {
        return "ADMIN";
    } else if (user.isCAAdmin) {
        return "CA-ADMIN";
    } else if (user.isAuditor) {
        return "AUDITOR";
    }
};
const needVaultConfig = () => {
    return (
        <Toolbar
            style={{
                backgroundColor: "#ab0000",
                justifyContent: "center",
                color: "white",
            }}
        >
            <Typography>
                <NavLink
                    exact={true}
                    color="inherit"
                    variant="body2"
                    to={"/client/configuration"}
                    style={{ textDecoration: "none", color: "white" }}
                >
                    Click to configure your Vault's Information
                </NavLink>
            </Typography>
        </Toolbar>
    );
};

const NavigationBar = (props) => {
    const classes = useStyles();
    const {
        logoutUserRequest,
        authReducer: {
            isAuthenticated,
            isAuthenticatedVault,
            user: {
                GID,
                isAdmin,
                isCAAdmin,
                isAuditor,
                username,
                organization,
            },
        },
        isLoggingOut,
    } = props;
    const handleLogout = () => logoutUserRequest();
    const userType = defineUserType(props.authReducer.user);

    return (
        isAuthenticated && (
            <React.Fragment>
                {/* Logo */}
                <Toolbar className={classes.toolbar}>
                    <Typography
                        component="h2"
                        variant="h6"
                        color="primary"
                        align="left"
                        className={classes.toolbarTitle}
                    >
                        MINISTRY OF HEALTH
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleLogout}
                    >
                        {!isLoggingOut ? "Logout" : "Logging out..."}
                    </Button>
                </Toolbar>
                {/* User Details */}
                <Toolbar className={classes.toolbarHelper}>
                    <Grid container justify="flex-start">
                        <Grid item style={{ flexGrow: "1" }}>
                            <Grid item style={{ textAlign: "left" }}>
                                <b>{username}</b> ({userType} at{" "}
                                {organization
                                    .replace(/-/g, " ")
                                    .replace(/_/g, " ")}
                                )
                            </Grid>
                        </Grid>
                        {GID && (
                            <Grid item>
                                <Typography variant="body2" align="right">
                                    {!isAuthenticatedVault ? (
                                        <Typography
                                            style={{ color: "#cc1818" }}
                                        >
                                            Vault: <b>Unconfigured</b>
                                        </Typography>
                                    ) : (
                                        <Typography
                                            style={{ color: "#38d200" }}
                                        >
                                            Vault: <b>Configured</b>
                                        </Typography>
                                    )}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </Toolbar>
                {/* Nav */}
                <Toolbar
                    component="nav"
                    variant="dense"
                    className={classes.toolbarSecondary}
                >
                    {isAdmin &&
                        AdminRoutes.map((section) => (
                            <NavLink
                                exact={section.exact}
                                activeStyle={{
                                    borderBottom: "solid 3px #fff",
                                    paddingBottom: "1em",
                                }}
                                color="inherit"
                                variant="body2"
                                to={section.path}
                                className={classes.toolbarLink}
                            >
                                {section.name}
                            </NavLink>
                        ))}
                    {isCAAdmin &&
                        CAAdminRoutes.map((section) => (
                            <NavLink
                                exact={section.exact}
                                activeStyle={{
                                    borderBottom: "solid 3px #fff",
                                    paddingBottom: "1em",
                                }}
                                color="inherit"
                                variant="body2"
                                to={section.path}
                                className={classes.toolbarLink}
                            >
                                {section.name}
                            </NavLink>
                        ))}
                    {isAuditor &&
                        AuditorRoutes.map((section) => (
                            <NavLink
                                exact={section.exact}
                                activeStyle={{
                                    borderBottom: "solid 3px #fff",
                                    paddingBottom: "1em",
                                }}
                                color="inherit"
                                variant="body2"
                                to={section.path}
                                className={classes.toolbarLink}
                            >
                                {section.name}
                            </NavLink>
                        ))}
                    {GID &&
                        ClientRoutes.map((section) => (
                            <NavLink
                                exact={section.exact}
                                activeStyle={{
                                    borderBottom: "solid 3px #fff",
                                    paddingBottom: "1em",
                                }}
                                color="inherit"
                                variant="body2"
                                to={section.path}
                                className={classes.toolbarLink}
                            >
                                {section.name}
                            </NavLink>
                        ))}
                </Toolbar>
                {GID && !isAuthenticatedVault && needVaultConfig()}
            </React.Fragment>
        )
    );
};

export default withRouter(NavigationBar);
