import React from "react";
import { withStyles } from "@material-ui/styles";
import Paper from "@material-ui/core/Paper";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import { withFormik, Field } from "formik";
import * as yup from "yup";
import { requestLogsInitValidationForm } from "../../../utils/processors/forms/input-validators/validationForms";
import {
    RadioButton,
    RadioButtonGroup,
} from "../../../utils/processors/forms/components/radioButton";
import ListAltIcon from "@material-ui/icons/ListAlt";
import { ConstructComponentTitle } from "../../../utils/processors/common/componentHelper";

const styles = (theme) => ({
    card: {},
    form: {
        width: "100%",
    },
    container: {
        display: "Flex",
        justifyContent: "center",
    },
    actions: {
        display: "Flex",
        justifyContent: "center",
    },
    paper: {
        padding: theme.spacing(1),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        marginBottom: theme.spacing(2),
    },
});

const typeOptions = [
    { key: "Update Logs", value: "UPDATE_LOG" },
    { key: "Request Logs", value: "REQUEST_LOG" },
];

const domains = [
    { key: "Proxy", value: "PROXY" },
    { key: "Medical", value: "MEDICAL" },
    { key: "Manufacturer", value: "MANUFACTURER" },
];

const RequestLogsInitForm = (props) => {
    const {
        classes,
        values,
        touched,
        errors,
        handleSubmit,
        requestAccessLoading,
    } = props;

    return (
        <Paper className={classes.paper}>
            <ConstructComponentTitle title={"Request Logs"} />
            <form onSubmit={handleSubmit} className={classes.form}>
                <Card className={classes.card}>
                    <CardContent>
                        <RadioButtonGroup
                            id="type"
                            label="Logs' Type"
                            value={values.type}
                            error={errors.type}
                            touched={touched.type}
                        >
                            {typeOptions.map((type) => (
                                <Field
                                    component={RadioButton}
                                    name="type"
                                    id={type.value}
                                    label={type.key}
                                />
                            ))}
                        </RadioButtonGroup>
                        <Divider />
                        <RadioButtonGroup
                            id="domain"
                            label="Domain"
                            value={values.domain}
                            error={errors.domain}
                            touched={touched.domain}
                        >
                            {domains.map((type) => (
                                <Field
                                    component={RadioButton}
                                    name="domain"
                                    id={type.value}
                                    label={type.key}
                                />
                            ))}
                        </RadioButtonGroup>
                    </CardContent>
                    <CardActions className={classes.actions}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={requestAccessLoading}
                            startIcon={<ListAltIcon />}
                            style={{ textTransform: "none" }}
                        >
                            {!requestAccessLoading
                                ? "Request Access"
                                : "Requesting Access..."}
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
        const { type, domain } = props;
        return {
            type: type || "",
            domain: domain || "",
        };
    },

    validationSchema: yup.object().shape(requestLogsInitValidationForm),

    handleSubmit: async (values, { props, setSubmitting }) => {
        const { auditInitVoteRequest: submitToAPI } = props;
        submitToAPI(values);
        setSubmitting(false);
    },
})(RequestLogsInitForm);

export default withStyles(styles, { withTheme: true })(Form);
