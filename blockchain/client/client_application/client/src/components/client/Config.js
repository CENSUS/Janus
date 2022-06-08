import React from "react";
import { makeStyles } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { withRouter } from "react-router-dom";
import VaultLoginModule from "../../containers/login/VaultLoginModule";
import { ConstructComponentTitle } from "../../utils/processors/common/componentHelper";

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
    },
}));

function AttributesPanel() {
    const classes = useStyles();
    return (
        <Container maxWidth="lg" className={classes.container}>
            <Grid container spacing={1} alignItems="flex-start">
                <Grid item xs={12} md={12} lg={12}>
                    <Paper className={classes.paper}>
                        <ConstructComponentTitle title="Vault Configuration" />
                        <VaultLoginModule />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default withRouter(AttributesPanel);
