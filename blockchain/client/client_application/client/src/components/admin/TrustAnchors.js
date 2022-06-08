import React from "react";
import { makeStyles } from "@material-ui/core";
import { Container, Grid, Paper } from "@material-ui/core";
import { withRouter } from "react-router-dom";
import UpdateTrustAnchors from "../../containers/admin/trustanchors/TrustAnchors";
import AddCA from "../../containers/admin/certAuthorities/AddCA";
import RemoveCA from "../../containers/admin/certAuthorities/RemoveCA";

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

function TrustAnchorsPage(props) {
    const classes = useStyles();

    return (
        <Container maxWidth="lg" className={classes.container}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={12} lg={12}>
                    <Paper className={classes.paper}>
                        {/* UpdateTrustAnchors */}
                        <UpdateTrustAnchors />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={12} lg={12}>
                    <Paper className={classes.paper}>
                        {/* AddCA */}
                        <AddCA />
                        {/* RemoveCA */}
                        <RemoveCA />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default withRouter(TrustAnchorsPage);
