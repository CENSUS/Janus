import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import SendIcon from "@material-ui/icons/Send";
import { withFormik } from "formik";
import * as yup from "yup";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import "date-fns";
import MomentUtils from "@date-io/moment";
import moment from "moment";
import { DATA_03ValidationForm } from "../../../../../utils/processors/forms/input-validators/dataIdsValidationForm";

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
                        label="Disease UUID"
                        value={values.uuid}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        helperText={touched.uuid ? errors.uuid : ""}
                        error={touched.uuid && Boolean(errors.uuid)}
                        margin="dense"
                        variant="outlined"
                        fullWidth
                    />
                    <Divider />
                    <TextField
                        id="clinic_uuid"
                        label="Clinic UUID"
                        value={values.clinic_uuid}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        helperText={
                            touched.clinic_uuid ? errors.clinic_uuid : ""
                        }
                        error={
                            touched.clinic_uuid && Boolean(errors.clinic_uuid)
                        }
                        margin="dense"
                        variant="outlined"
                        fullWidth
                    />
                    <Divider />
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <DatePicker
                            variant="inline"
                            label="Start Date"
                            format="ll"
                            value={values.start_date}
                            onChange={(value) =>
                                props.setFieldValue(
                                    "start_date",
                                    moment(value).format("YYYY-MM-DD")
                                )
                            }
                        />
                    </MuiPickersUtilsProvider>
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <DatePicker
                            variant="inline"
                            label="End Date"
                            format="ll"
                            value={values.end_date}
                            onChange={(value) =>
                                props.setFieldValue(
                                    "end_date",
                                    moment(value).format("YYYY-MM-DD")
                                )
                            }
                        />
                    </MuiPickersUtilsProvider>
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
        const { uuid, clinic_uuid, start_date, end_date } = props;
        return {
            uuid: uuid || "",
            clinic_uuid: clinic_uuid || "",
            start_date: start_date || null,
            end_date: end_date || null,
        };
    },

    validationSchema: yup.object().shape(DATA_03ValidationForm),

    handleSubmit: async (values, { props, setSubmitting }) => {
        const { requestAccessRequest: submitToAPI, dataID } = props;
        values["dataID"] = dataID;

        submitToAPI(values);

        setSubmitting(false);
    },
})(DataForm);

export default withStyles(styles, { withTheme: true })(Form);
