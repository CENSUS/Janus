import React from "react";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import { CustomDivider } from "../../helper";

export const ConstructComponentTitle = ({ title }) => (
    <CustomDivider>
        <Typography variant="h6" gutterBottom>
            {title}
        </Typography>
    </CustomDivider>
);

export const GridDivider = ({ style = { backgroundColor: "white" } }) => {
    return (
        <Grid item xs={12}>
            <Divider style={style} />
        </Grid>
    );
};
