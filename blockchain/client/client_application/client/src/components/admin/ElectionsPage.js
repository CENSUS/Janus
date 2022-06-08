import React from "react";
import { makeStyles } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";

import { withRouter } from "react-router-dom";
import Elections from "../../containers/admin/elections/Elections";

const useStyles = makeStyles((theme) => ({
    container: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
    },
    paper: {
        padding: theme.spacing(1),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        backgroundColor: theme.palette.common.softGray,
    },
}));

function ElectionsPage() {
    const classes = useStyles();

    return (
        <Container maxWidth="lg" className={classes.container}>
            <Grid container>
                <Grid item xs={12}>
                    <Paper className={classes.paper}>
                        {/* Elections */}
                        <Elections />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default withRouter(ElectionsPage);
