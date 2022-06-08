import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Paper from "@material-ui/core/Paper";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import Tooltip from "@material-ui/core/Tooltip";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import { withFormik } from "formik";
import { ConstructComponentTitle } from "../../../utils/processors/common/componentHelper";

const styles = () => ({
    card: {
        marginTop: 8,
    },
    actions: {
        display: "Flex",
        justifyContent: "center",
    },
    paper: {
        height: "100%",
        borderRadius: "0",
    },
});

const AddCAForm = (props) => {
    const {
        classes,
        values,
        touched,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
    } = props;

    const canSubmit = values.caName;

    return (
        <Grid container spacing={1}>
            <Grid item xs={3} md={3} lg={3}>
                <Paper className={classes.paper}>
                    <ConstructComponentTitle title="Remove CA" />
                    <form onSubmit={handleSubmit}>
                        <Card className={classes.card}>
                            <CardContent>
                                <TextField
                                    id="caName"
                                    label="Organization Name"
                                    value={values.caName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    helperText={
                                        touched.caName ? errors.caName : ""
                                    }
                                    error={
                                        touched.caName && Boolean(errors.caName)
                                    }
                                    margin="dense"
                                    variant="outlined"
                                    fullWidth
                                />
                                <Divider />
                            </CardContent>
                            <CardActions className={classes.actions}>
                                <Tooltip title="It will initialize a Voting to remove an existing CA from the Blockchain">
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<HighlightOffIcon />}
                                        disabled={!canSubmit}
                                        style={{ textTransform: "none" }}
                                    >
                                        Remove CA
                                    </Button>
                                </Tooltip>
                            </CardActions>
                        </Card>
                    </form>
                </Paper>
            </Grid>
        </Grid>
    );
};

const Form = withFormik({
    enableReinitialize: false,
    mapPropsToValues: (props) => {
        const { caName } = props;
        return {
            caName: caName || null,
        };
    },

    //validationSchema: yup.object().shape(votingValidationForm),

    handleSubmit: async (values, { props }) => {
        const { removeCARequest: submitToAPI } = props;
        const payload = values.caName;
        submitToAPI(payload);
    },
})(AddCAForm);

export default withStyles(styles, { withTheme: true })(Form);
