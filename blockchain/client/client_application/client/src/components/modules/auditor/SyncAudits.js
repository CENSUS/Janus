import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import { withFormik } from "formik";
import * as yup from "yup";
import { requestLogsValidationForm } from "../../../utils/processors/forms/input-validators/validationForms";
import GetAppIcon from "@material-ui/icons/GetApp";
import { ConstructComponentTitle } from "../../../utils/processors/common/componentHelper";

const styles = () => ({
    card: {
        marginTop: 8,
    },
    actions: {
        display: "Flex",
        justifyContent: "center",
    },
    form: {
        width: "100%",
    },
    container: {
        display: "Flex",
        justifyContent: "center",
    },
});

const TrustAnchorsForm = (props) => {
    const {
        classes,
        values,
        touched,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
    } = props;
    const { syncAuditsLoading } = props;

    return (
        <Paper className={classes.paper}>
            <ConstructComponentTitle title={"Access Logs"} />
            <form onSubmit={handleSubmit} className={classes.form}>
                <Card className={classes.card}>
                    <CardContent>
                        <TextField
                            id="requestID"
                            label="Request ID (Optional)"
                            value={values.orgMSP}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            helperText={
                                touched.requestID ? errors.requestID : ""
                            }
                            error={
                                touched.requestID && Boolean(errors.requestID)
                            }
                            margin="dense"
                            variant="outlined"
                            fullWidth
                        />
                    </CardContent>
                    <CardActions className={classes.actions}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<GetAppIcon />}
                            disabled={syncAuditsLoading}
                            style={{ textTransform: "none" }}
                        >
                            {!syncAuditsLoading ? "Sync Audits" : "Syncing..."}
                        </Button>
                    </CardActions>
                </Card>
            </form>
        </Paper>
    );
};

const Form = withFormik({
    enableReinitialize: false,
    mapPropsToValues: (props) => {
        const { requestID } = props;
        return {
            requestID: requestID || "",
        };
    },

    validationSchema: yup.object().shape(requestLogsValidationForm),

    handleSubmit: async (values, { props }) => {
        const { syncAuditsRequest: submitToAPI } = props;
        submitToAPI(values);
    },
})(TrustAnchorsForm);

export default withStyles(styles, { withTheme: true })(Form);
