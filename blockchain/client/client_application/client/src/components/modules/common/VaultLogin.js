import React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import { withStyles, Divider } from "@material-ui/core";
import { withFormik } from "formik";
import * as yup from "yup";
import { vaultLoginValidationForm } from "../../../utils/processors/forms/input-validators/validationForms";

const styles = (theme) => ({
    container: {
        display: "Flex",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    form: {
        width: "100%",
        minHeight: 200,
        marginBottom: theme.spacing(1),
    },
    paper: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
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
        isLoggingInVault,
        isAuthenticatedVault,
        vaultUsername,
    } = props;

    return (
        <Container component="main" maxWidth="xs" className={classes.container}>
            <div className={classes.paper}>
                <Typography variant="subtitle2">
                    {isAuthenticatedVault
                        ? `Logged-in as ${vaultUsername}`
                        : `Not logged in`}
                </Typography>
                <form className={classes.form} onSubmit={handleSubmit}>
                    <Divider />
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
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        style={{ textTransform: "none" }}
                        disabled={isLoggingInVault}
                    >
                        {isLoggingInVault
                            ? isAuthenticatedVault
                                ? "CHANGING USER..."
                                : "LOGGING IN..."
                            : isAuthenticatedVault
                            ? "CHANGE USER"
                            : "LOGIN"}
                    </Button>
                </form>
            </div>
        </Container>
    );
};

const Form = withFormik({
    enableReinitialize: false,
    mapPropsToValues: (props) => {
        const { username, password } = props;
        return {
            username: username || "",
            password: password || "",
        };
    },

    validationSchema: yup.object().shape(vaultLoginValidationForm),

    handleSubmit: async (values, { props }) => {
        const { loginWithVaultRequest, userOrganization } = props;
        const payload = { values, userOrganization };
        loginWithVaultRequest(payload);
    },
})(form);

export default withStyles(styles, { withTheme: true })(Form);
