import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { withFormik } from "formik";
import * as yup from "yup";
import { syncWithBCForm } from "../../../../utils/processors/forms/input-validators/validationForms";
import ListIcon from "@material-ui/icons/List";
import { ConstructComponentTitle } from "../../../../utils/processors/common/componentHelper";

const styles = () => ({
    card: {
        maxWidth: 420,
        marginTop: 8,
        display: "inline-block",
    },
    actions: {
        display: "Flex",
        justifyContent: "center",
    },
});

const SyncWithBCForm = (props) => {
    const {
        classes,
        values,
        touched,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
        isSyncing,
    } = props;

    return (
        <form onSubmit={handleSubmit}>
            <Card className={classes.card}>
                <ConstructComponentTitle title="My Requests" />
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <CardContent>
                        <TextField
                            id="reqID"
                            label="Request ID (Optional)"
                            value={values.reqID}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            helperText={touched.reqID ? errors.reqID : ""}
                            error={touched.reqID && Boolean(errors.reqID)}
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
                            startIcon={<ListIcon />}
                            style={{ textTransform: "none" }}
                            disabled={isSyncing}
                        >
                            {isSyncing ? "Please wait..." : "View My Requests"}
                        </Button>
                    </CardActions>
                </div>
            </Card>
        </form>
    );
};

const Form = withFormik({
    enableReinitialize: false,
    mapPropsToValues: (props) => {
        const { reqID } = props;
        return {
            reqID: reqID || "",
        };
    },

    validationSchema: yup.object().shape(syncWithBCForm),

    handleSubmit: async (values, { props, setSubmitting }) => {
        const { syncWithBCClientRequests: submitToAPI } = props;
        submitToAPI(values);
        setSubmitting(false);
    },
})(SyncWithBCForm);

export default withStyles(styles, { withTheme: true })(Form);
