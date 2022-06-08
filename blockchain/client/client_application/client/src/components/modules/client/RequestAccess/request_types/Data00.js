import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import SendIcon from "@material-ui/icons/Send";
import { withFormik } from "formik";
import * as yup from "yup";
import { DATA_00ValidationForm } from "../../../../../utils/processors/forms/input-validators/dataIdsValidationForm";

const styles = () => ({
    card: {},
    actions: {
        display: "Flex",
        justifyContent: "center",
    },
});

const DataForm = (props) => {
    const {
        classes,
        values,
        touched,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmittingRequest,
    } = props;

    return (
        <form onSubmit={handleSubmit}>
            <Card className={classes.card}>
                <CardContent>
                    <TextField
                        id="uuid"
                        label="UUID"
                        value={values.uuid}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        helperText={touched.uuid ? errors.uuid : ""}
                        error={touched.uuid && Boolean(errors.uuid)}
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
                        startIcon={<SendIcon />}
                        style={{ textTransform: "none" }}
                        disabled={isSubmittingRequest}
                    >
                        {isSubmittingRequest
                            ? "Submitting..."
                            : "Submit Request"}
                    </Button>
                </CardActions>
            </Card>
        </form>
    );
};

const Form = withFormik({
    enableReinitialize: false,
    mapPropsToValues: (props) => {
        const { uuid, ssn, firstname, surname, date_of_birth } = props;
        return {
            uuid: uuid || "",
            ssn: ssn || "",
            firstname: firstname || "",
            surname: surname || "",
            date_of_birth: date_of_birth || "",
        };
    },

    validationSchema: yup.object().shape(DATA_00ValidationForm),

    handleSubmit: async (values, { props, setSubmitting }) => {
        const { requestAccessRequest: submitToAPI, dataID } = props;
        values["dataID"] = dataID;

        submitToAPI(values);

        setSubmitting(false);
    },
})(DataForm);

export default withStyles(styles, { withTheme: true })(Form);
