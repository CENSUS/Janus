import React from "react";
import { makeStyles } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import { ListSubheader } from "@material-ui/core";
import RefreshIcon from "@material-ui/icons/Refresh";
import { ConstructComponentTitle } from "../../../../utils/processors/common/componentHelper";

const useStyles = makeStyles((theme) => ({
    list: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        overflow: "auto",
        maxHeight: 100,
    },
    listSection: {
        backgroundColor: "inherit",
    },
    listItemText: {
        textAlign: "center",
    },
    ul: {
        backgroundColor: "inherit",
        padding: 0,
    },
    paper: {
        padding: theme.spacing(1),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        marginBottom: theme.spacing(2),
        margin: "auto",
    },
}));

function ActiveCombinedIdentities({
    combinedIdentities,
    organizationsList,
    getCombinedIdentitiesRequest,
    isRefreshingIdentities,
}) {
    const classes = useStyles();
    const [combinedIdentitiesList, updateCombinedIdentitiesList] =
        React.useState(combinedIdentities);

    React.useEffect(() => {
        if (!combinedIdentities) {
            getCombinedIdentitiesRequest();
        } else {
            updateCombinedIdentitiesList(combinedIdentities);
        }
    }, [combinedIdentities, getCombinedIdentitiesRequest]);

    return (
        <Paper className={classes.paper}>
            <Grid container spacing={1}>
                <Grid item xs={12}>
                    <ConstructComponentTitle title="Active Identities" />
                    <List className={classes.list} subheader={<li />}>
                        {Object.keys(organizationsList).map((domain) => (
                            <>
                                <li
                                    key={`section-${domain}`}
                                    className={classes.listSection}
                                >
                                    <ul className={classes.ul}>
                                        {organizationsList[domain].map(
                                            (organization) => (
                                                <>
                                                    <ListSubheader>
                                                        {organization.name}
                                                    </ListSubheader>
                                                    {combinedIdentitiesList &&
                                                        combinedIdentitiesList[
                                                            organization.name
                                                        ] &&
                                                        Object.values(
                                                            combinedIdentitiesList[
                                                                organization
                                                                    .name
                                                            ]
                                                        )
                                                            .filter(
                                                                (user) =>
                                                                    user.isActive
                                                            )
                                                            .map((user) => (
                                                                <Tooltip
                                                                    title={
                                                                        organization.name
                                                                    }
                                                                >
                                                                    <ListItem
                                                                        key={`item-${user.username}`}
                                                                    >
                                                                        <ListItemText
                                                                            primary={user.username.toUpperCase()}
                                                                            className={
                                                                                classes.listItemText
                                                                            }
                                                                        />
                                                                    </ListItem>
                                                                </Tooltip>
                                                            ))}
                                                </>
                                            )
                                        )}
                                    </ul>
                                </li>
                            </>
                        ))}
                    </List>
                </Grid>
                <Grid item xs={12}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        style={{ textTransform: "none" }}
                        onClick={() => getCombinedIdentitiesRequest()}
                        disabled={isRefreshingIdentities}
                    >
                        Refresh
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
}

export default ActiveCombinedIdentities;
