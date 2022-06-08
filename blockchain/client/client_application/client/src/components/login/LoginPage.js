import React from "react";
import Login from "../../containers/login/LoginModule";
import {
    withStyles,
    Grid,
    Paper,
    Typography,
    Divider,
} from "@material-ui/core";

const styles = (theme) => ({
    root: {
        minWidth: "100%",
        minHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: theme.palette.background.default,
    },
    title: {
        color: theme.palette.primary.main,
    },
    dividerHorizontal: {
        background: "#fff",
        margin: "7px 0 7px 0",
        width: "100%",
    },
});

function Public(props) {
    const { classes } = props;

    return (
        <Grid
            className={classes.root}
            spacing={0}
            alignItems="center"
            justify="center"
        >
            <Typography
                component="h2"
                variant="h4"
                align="center"
                noWrap
                className={classes.title}
            >
                MINISTRY OF HEALTH
            </Typography>
            <Divider className={classes.dividerHorizontal} />
            <Paper>
                <Login />
            </Paper>
            <Divider className={classes.dividerHorizontal} />
        </Grid>
    );
}

export default withStyles(styles, { withTheme: true })(Public);
