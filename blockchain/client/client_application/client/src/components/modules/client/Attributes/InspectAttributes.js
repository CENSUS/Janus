import React from "react";
import { makeStyles } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Paper from "@material-ui/core/Paper";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import { PrettyPrintJSON } from "../../../../utils/processors/data_processors";

const useStyles = makeStyles((theme) => ({
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
    list: {
        width: "100%",
        backgroundColor: theme.palette.common.white,
        position: "relative",
        overflow: "auto",
        maxHeight: 500,
    },
    listSection: {
        backgroundColor: "inherit",
    },
    ul: {
        backgroundColor: "inherit",
        padding: 0,
    },
    menuButton: {
        marginRight: 36,
    },
    menuButtonHidden: {
        display: "none",
    },
    table: {
        width: "100%",
    },
    paper: {
        padding: theme.spacing(1),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        marginBottom: theme.spacing(2),
        margin: "auto",
    },
    fixedHeight: {
        height: 240,
    },
    title: {
        flex: "1 1 100%",
        color: theme.palette.common.white,
        backgroundColor: theme.palette.primary.main,
    },
    submitButton: {
        margin: theme.spacing(3, 0, 2),
        backgroundColor: "#184e77",
        color: "#fff",
        "&:hover": {
            backgroundColor: "#245d88",
            borderColor: "#184E77",
        },
    },
}));

function InspectAttributes({ organizationsList, validatedUserData }) {
    const classes = useStyles();
    const [validatedUser, updateValidatedUser] =
        React.useState(validatedUserData);

    React.useEffect(() => {
        updateValidatedUser(validatedUserData);
    }, [validatedUserData]);

    const {
        // condition: successfulValidation,
        message: data,
    } = validatedUser;

    const {
        ROLES: userRoles,
        TEMPORALROLES: userTemporalRoles,
        // EXTRA: userExtras,
        GID,
    } = data || {};

    return (
        <Grid container>
            <Grid item xs={12}>
                <Paper className={classes.paper}>
                    <Grid container>
                        <Grid item xs={12} className={classes.title}>
                            <Typography
                                component="h2"
                                variant="h6"
                                className={classes.title}
                            >
                                Validated User
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" id="gid" component="div">
                                {`${GID ? GID : "-"}`}
                            </Typography>
                        </Grid>
                        {/* User Roles */}
                        <Grid item xs={12} className={classes.title}>
                            <Typography
                                className={classes.title}
                                variant="h6"
                                id="tableTitle"
                                component="div"
                            >
                                Roles
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            {userRoles &&
                                Object.keys(organizationsList).map(
                                    (
                                        domain // Get the available domains from the .env file
                                    ) => (
                                        <List
                                            className={classes.list}
                                            subheader={<li />}
                                        >
                                            {Object.values(
                                                organizationsList[domain]
                                            )
                                                .filter(
                                                    (
                                                        initOrganization // Filter out the organizations (that exist in the .env) that are not available in the user's validated data
                                                    ) =>
                                                        Object.keys(
                                                            userRoles
                                                        ).includes(
                                                            initOrganization.msp
                                                        )
                                                )
                                                .map(({ name, msp }) => (
                                                    <li
                                                        key={`section-${msp}`}
                                                        className={
                                                            classes.listSection
                                                        }
                                                    >
                                                        <ul
                                                            className={
                                                                classes.ul
                                                            }
                                                        >
                                                            <ListSubheader>{`${name}`}</ListSubheader>
                                                            {userRoles[msp] &&
                                                                Object.values(
                                                                    userRoles[
                                                                        msp
                                                                    ]
                                                                ).map(
                                                                    (
                                                                        userRole
                                                                    ) => (
                                                                        <ListItem
                                                                            key={`item-${msp}-${userRole.ROLE}`}
                                                                        >
                                                                            <ListItemText
                                                                                disableTypography
                                                                                primary={
                                                                                    <Typography
                                                                                        type="body2"
                                                                                        style={{
                                                                                            color: "black",
                                                                                            textAlign:
                                                                                                "center",
                                                                                        }}
                                                                                    >
                                                                                        {
                                                                                            userRole.ROLE
                                                                                        }
                                                                                    </Typography>
                                                                                }
                                                                            />
                                                                        </ListItem>
                                                                    )
                                                                )}
                                                        </ul>
                                                    </li>
                                                ))}
                                        </List>
                                    )
                                )}
                        </Grid>
                        <Grid item xs={12} className={classes.title}>
                            {/* User Roles */}
                            <Typography
                                className={classes.title}
                                variant="h6"
                                id="tableTitle"
                                component="div"
                            >
                                Temporal Roles
                            </Typography>
                            {userTemporalRoles &&
                                Object.keys(organizationsList).map(
                                    (
                                        domain // Get the available domains from the .env file
                                    ) => (
                                        <List
                                            className={classes.list}
                                            subheader={<li />}
                                        >
                                            {Object.values(
                                                organizationsList[domain]
                                            )
                                                .filter(
                                                    (
                                                        initOrganization // Filter out the organizations (that exist in the .env) that are not available in the user's validated data
                                                    ) =>
                                                        Object.keys(
                                                            userTemporalRoles
                                                        ).includes(
                                                            initOrganization.msp
                                                        )
                                                )
                                                .map(({ name, msp }) => (
                                                    <li
                                                        key={`section-${msp}`}
                                                        className={
                                                            classes.listSection
                                                        }
                                                    >
                                                        <ul
                                                            className={
                                                                classes.ul
                                                            }
                                                        >
                                                            <ListSubheader>{`${name.replaceAll(
                                                                "-",
                                                                " "
                                                            )}`}</ListSubheader>
                                                            {userTemporalRoles[
                                                                msp
                                                            ] &&
                                                                Object.values(
                                                                    userTemporalRoles[
                                                                        msp
                                                                    ]
                                                                ).map(
                                                                    (
                                                                        temporalRole
                                                                    ) => (
                                                                        <Paper
                                                                            className={
                                                                                classes.paper
                                                                            }
                                                                        >
                                                                            <ListItem
                                                                                key={`item-${msp}-${temporalRole.ROLE}`}
                                                                            >
                                                                                <ListItemText
                                                                                    disableTypography
                                                                                    primary={
                                                                                        <Typography
                                                                                            type="body2"
                                                                                            style={{
                                                                                                color: "black",
                                                                                                textAlign:
                                                                                                    "center",
                                                                                            }}
                                                                                        >
                                                                                            {temporalRole.ROLE.split(
                                                                                                "_"
                                                                                            ).join(
                                                                                                " "
                                                                                            )}
                                                                                        </Typography>
                                                                                    }
                                                                                />
                                                                            </ListItem>
                                                                            <PrettyPrintJSON
                                                                                data={
                                                                                    temporalRole.DATA
                                                                                }
                                                                            />
                                                                        </Paper>
                                                                    )
                                                                )}
                                                        </ul>
                                                    </li>
                                                ))}
                                        </List>
                                    )
                                )}
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        </Grid>
    );
}

export default InspectAttributes;
