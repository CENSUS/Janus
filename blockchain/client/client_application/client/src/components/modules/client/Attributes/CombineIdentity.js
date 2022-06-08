import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import Paper from "@material-ui/core/Paper";
import { withFormik } from "formik";
import * as yup from "yup";
import { loginValidationForm } from "../../../../utils/processors/forms/input-validators/validationForms";
import MergeTypeIcon from "@material-ui/icons/MergeType";
import { ConstructComponentTitle } from "../../../../utils/processors/common/componentHelper";

const styles = (theme) => ({
    form: {
        width: "100%",
        marginTop: theme.spacing(1),
    },
    paper: {
        padding: theme.spacing(1),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        marginBottom: theme.spacing(2),
        margin: "auto",
    },
});

const form = (props) => {
    const {
        classes,
        values,
        touched,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
        organizationsList,
        isCombining,
    } = props;

    return (
        <Grid container>
            <Paper className={classes.paper}>
                <ConstructComponentTitle title="Combine Identity" />
                <form className={classes.form} onSubmit={handleSubmit}>
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
                        type="password"
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
                    <TextField
                        select
                        id="organization"
                        label="Organization"
                        value={values.organization}
                        onChange={handleChange("organization")}
                        helperText={
                            touched.organization ? errors.organization : ""
                        }
                        error={
                            touched.organization && Boolean(errors.organization)
                        }
                        margin="dense"
                        variant="outlined"
                        fullWidth
                    >
                        {Object.keys(organizationsList).map((domain) =>
                            Object.values(organizationsList[domain]).map(
                                (stakeholder) => (
                                    <MenuItem
                                        key={stakeholder.name}
                                        value={stakeholder.name}
                                    >
                                        {stakeholder.name}
                                    </MenuItem>
                                )
                            )
                        )}
                    </TextField>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<MergeTypeIcon />}
                        style={{ textTransform: "none" }}
                        disabled={isCombining}
                    >
                        {isCombining ? "Combining..." : "Combine Identity"}
                    </Button>
                </form>
            </Paper>
        </Grid>
    );
};

const Form = withFormik({
    enableReinitialize: false,
    mapPropsToValues: (props) => {
        const { username, organization, password } = props;
        return {
            username: username || "",
            password: password || "",
            organization: organization || "",
        };
    },

    validationSchema: yup.object().shape(loginValidationForm),

    handleSubmit: async (values, { props, setSubmitting }) => {
        const { combineIdentitiesRequest: submitToAPI } = props;
        submitToAPI(values);
        setSubmitting(false);
    },
})(form);

export default withStyles(styles, { withTheme: true })(Form);
