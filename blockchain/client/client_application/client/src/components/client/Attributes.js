import React from "react";
import { makeStyles } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { withRouter } from "react-router-dom";
import CombinedIdentitiesPanel from "../../containers/client/CombinedIdentitiesPanel";
import CombineIdentity from "../../containers/client/CombineIdentity";
import InspectAttributes from "../../containers/client/InspectAttributes";

const useStyles = makeStyles((theme) => ({
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
    paper: {
        padding: theme.spacing(1),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        backgroundColor: theme.palette.common.softGray,
    },
}));

function AttributesPanel() {
    const classes = useStyles();
    return (
        <Container maxWidth="lg" className={classes.container}>
            <Grid container spacing={1} alignItems="flex-start">
                <Grid item xs={4} md={4} lg={4}>
                    <Paper className={classes.paper}>
                        <CombineIdentity />
                        <CombinedIdentitiesPanel />
                    </Paper>
                </Grid>
                <Grid item xs={8} md={8} lg={8}>
                    <Paper className={classes.paper}>
                        <InspectAttributes />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default withRouter(AttributesPanel);
