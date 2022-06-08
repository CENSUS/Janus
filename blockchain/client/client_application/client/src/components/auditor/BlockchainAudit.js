import React from "react";
import { makeStyles } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { withRouter } from "react-router-dom";
import RequestLogsInit from "../../containers/auditor/logs/RequestLogsInit";
import SyncAudits from "../../containers/auditor/logs/SyncAudits";
import LogsVisualizer from "../../containers/auditor/logs/LogsVisualizer";
import SyncAuditsPanel from "../../containers/auditor/logs/SyncAuditsPanel";

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

function AuditorPanel() {
    const classes = useStyles();
    return (
        <Container maxWidth="lg" className={classes.container}>
            <Grid
                container
                justify="space-around"
                spacing={4}
                component={Paper}
            >
                <Grid item xs={3} md={3} lg={3}>
                    <Paper className={classes.paper}>
                        {/* RequestLogsInit Form */}
                        <RequestLogsInit />
                        {/* RequestLogs Form */}
                        <SyncAudits />
                    </Paper>
                </Grid>
                <Grid item xs={9} md={9} lg={9}>
                    <Paper className={classes.paper}>
                        {/* SyncAuditsPanel Panel */}
                        <SyncAuditsPanel />
                        {/* Logs */}
                        <LogsVisualizer />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default withRouter(AuditorPanel);
