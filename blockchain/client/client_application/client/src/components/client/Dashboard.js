import React from "react";
import { makeStyles } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import Paper from "@material-ui/core/Paper";
import { withRouter } from "react-router-dom";
import RequestAccess from "../../containers/client/data/RequestAccess";
import SyncWithBCPanel from "../../containers/client/SyncWithBCPanel";
import SyncWithBCForm from "../../containers/client/SyncWithBCForm";
import DataTable from "../../containers/client/DataTable";

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

function ClientPanel() {
    const classes = useStyles();
    return (
        <Container className={classes.container}>
            <Grid container alignItems="flex-start">
                <Divider />
            </Grid>
            <Grid container spacing={1} alignItems="flex-start">
                {/* RequestAccess & SyncWithBCForm Form */}
                <Grid item xs={3} md={3} lg={3}>
                    <Paper className={classes.paper}>
                        <SyncWithBCForm />
                        <RequestAccess />
                    </Paper>
                </Grid>
                {/* SyncWithBC Panel */}
                <Grid item xs={9} md={9} lg={9}>
                    <Paper className={classes.paper}>
                        <SyncWithBCPanel />
                    </Paper>
                    <Divider />
                    <Paper className={classes.paper}>
                        <DataTable />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default withRouter(ClientPanel);
