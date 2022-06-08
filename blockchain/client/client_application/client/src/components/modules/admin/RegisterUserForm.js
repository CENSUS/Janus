import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import { withFormik, Field } from "formik";
import * as yup from "yup";
import { registerValidationForm } from "../../../utils/processors/forms/input-validators/validationForms";
import {
    RadioButton,
    RadioButtonGroup,
} from "../../../utils/processors/forms/components/radioButton";
import {
    Checkbox,
    CheckboxGroup,
} from "../../../utils/processors/forms/components/checkbox";
import Add from "@material-ui/icons/Add";
import { ConstructComponentTitle } from "../../../utils/processors/common/componentHelper";

const styles = () => ({
    container: {
        display: "Flex",
        justifyContent: "center",
    },
    actions: {
        display: "Flex",
        justifyContent: "center",
    },
});

const GID = "GID";
const typeOptions = [
    { key: "Client", value: "client" },
    { key: "Admin", value: "admin" },
];

const attributeTypes = [
    { key: "Role", value: "role" },
    { key: "None", value: "none" },
];

const roleAttributes = (values) => [
    {
        name: "attrs",
        value: "Doctor",
        disabledCondition:
            values.includes("Researcher") ||
            values.includes("Technician") ||
            values.includes("Auditor") ||
            values.includes("Manufacturing_Staff") ||
            values.includes("CA-Admin"),
    },
    {
        name: "attrs",
        value: "Technician",
        disabledCondition:
            values.includes("Researcher") ||
            values.includes("Doctor") ||
            values.includes("Auditor") ||
            values.includes("Manufacturing_Staff") ||
            values.includes("CA-Admin"),
    },
    {
        name: "attrs",
        value: "Researcher",
        disabledCondition:
            values.includes("Technician") ||
            values.includes("Doctor") ||
            values.includes("Auditor") ||
            values.includes("Manufacturing_Staff") ||
            values.includes("CA-Admin"),
    },
    {
        name: "attrs",
        value: "Auditor",
        disabledCondition:
            values.includes("Researcher") ||
            values.includes("Doctor") ||
            values.includes("Technician") ||
            values.includes("Manufacturing_Staff") ||
            values.includes("CA-Admin"),
    },
    {
        name: "attrs",
        value: "Manufacturing_Staff",
        disabledCondition:
            values.includes("Researcher") ||
            values.includes("Doctor") ||
            values.includes("Technician") ||
            values.includes("Auditor") ||
            values.includes("CA-Admin"),
    },
    {
        name: "attrs",
        value: "CA-Admin",
        disabledCondition:
            values.includes("Researcher") ||
            values.includes("Doctor") ||
            values.includes("Technician") ||
            values.includes("Manufacturing_Staff") ||
            values.includes("Auditor"),
    },
];
const constructAttributes = (
    attribute,
    attributeType = null,
    isGID = false
) => {
    return {
        name: isGID
            ? GID
            : attributeType.toUpperCase() + "_" + attribute.toUpperCase(),
        value: isGID ? attribute : attribute.toUpperCase(),
        ecert: true,
    };
};

const constructIdentity = (values) => {
    let identity = {
        enrollmentID: values.username,
        enrollmentSecret: values.password,
        role: values.type,
        attrs:
            values.attributeType !== attributeTypes[1].value
                ? [constructAttributes(values.attrs[0], values.attributeType)]
                : [],
    };
    if (values.GID)
        identity.attrs.push(constructAttributes(values.GID, null, true));

    return identity;
};

const RegisterForm = (props) => {
    const {
        classes,
        values,
        touched,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
        setFieldTouched,
    } = props;

    const updatedRoleAttributes = roleAttributes(values.attrs);
    const disabledGID =
        values.type !== "client" || values.attrs.includes("Auditor")
            ? true
            : false;
    values.attrs = values.role === "admin" ? [] : values.attrs;
    values.GID =
        values.attrs.includes("Auditor") || values.type === "admin"
            ? ""
            : values.GID;
    return (
        <Grid container>
            <ConstructComponentTitle title={"Identity Information"} />
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardContent>
                        <TextField
                            id="username"
                            label="Username"
                            value={values.username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            helperText={touched.username ? errors.username : ""}
                            error={touched.username && Boolean(errors.username)}
                            margin="dense"
                            variant="outlined"
                            fullWidth
                        />
                        <TextField
                            id="password"
                            label="Password"
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            helperText={touched.password ? errors.password : ""}
                            error={touched.password && Boolean(errors.password)}
                            margin="dense"
                            variant="outlined"
                            fullWidth
                        />
                        <Divider />
                        <RadioButtonGroup
                            id="type"
                            label="Entity type"
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
                            id="attributeType"
                            label="Attribute Type"
                            value={values.attributeType}
                            error={errors.attributeType}
                            touched={touched.attributeType}
                        >
                            {attributeTypes.map((type) => (
                                <Field
                                    component={RadioButton}
                                    name="attributeType"
                                    id={type.value}
                                    label={type.key}
                                />
                            ))}
                        </RadioButtonGroup>
                        <CheckboxGroup
                            id="attrs"
                            label="Attributes"
                            value={values.attrs}
                            error={errors.attrs}
                            touched={touched.attrs}
                            onChange={setFieldValue}
                            onBlur={setFieldTouched}
                        >
                            {updatedRoleAttributes.map((attribute) => (
                                <Field
                                    component={Checkbox}
                                    name="attrs"
                                    id={attribute.value}
                                    label={attribute.value.replace("_", " ")}
                                    disabled={
                                        attribute.disabledCondition ||
                                        values.role === "admin"
                                    }
                                />
                            ))}
                        </CheckboxGroup>
                        <Divider />
                        <TextField
                            id="GID"
                            label="GID"
                            value={values.GID}
                            onChange={handleChange}
                            disabled={disabledGID}
                            onBlur={handleBlur}
                            helperText={touched.GID ? errors.GID : ""}
                            error={touched.GID && Boolean(errors.GID)}
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
                            startIcon={<Add />}
                            style={{ textTransform: "none" }}
                        >
                            Add Identity
                        </Button>
                    </CardActions>
                </Card>
            </form>
        </Grid>
    );
};

const Form = withFormik({
    enableReinitialize: false,
    mapPropsToValues: (props) => {
        const { username, password, type, attributeType, attrs, GID } = props;
        return {
            username: username || "",
            password: password || "",
            type: type || typeOptions[0].value,
            attributeType: attributeType || attributeTypes[1].value,
            attrs: attrs || [],
            GID: GID || "",
        };
    },

    validationSchema: yup.object().shape(registerValidationForm),

    handleSubmit: async (values, { props, setSubmitting }) => {
        const { appendToRegisterUserRegistryRequest } = props;
        const temporalValues = JSON.parse(JSON.stringify(values));
        delete temporalValues["identities"];
        const constructedIdentity = constructIdentity(temporalValues);
        appendToRegisterUserRegistryRequest(constructedIdentity);
        setSubmitting(false);
    },
})(RegisterForm);

export default withStyles(styles, { withTheme: true })(Form);
