import React from "react";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Container from "@material-ui/core/Container";
import withStyles from "@material-ui/core/styles/withStyles";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import { withFormik } from "formik";
import * as yup from "yup";
import { loginValidationForm } from "../../../utils/processors/forms/input-validators/validationForms";
import { CustomDivider } from "../../../utils/helper";

const styles = (theme) => ({
    form: {
        width: "100%",
        marginBottom: theme.spacing(1),
    },
    avatar: {
        backgroundColor: theme.palette.primary.main,
        color: "#fff",
    },
    paper: {
        marginTop: theme.spacing(3),
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
        organizationsList,
        isFetchingLogin,
    } = props;

    return (
        <Container component="main" maxWidth="xs">
            <div className={classes.paper}>
                <CustomDivider>
                    <Avatar className={classes.avatar}>
                        <LockOutlinedIcon />
                    </Avatar>
                </CustomDivider>

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
                        label="Your Organization"
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
                                        {stakeholder.name
                                            .replaceAll("_", " ")
                                            .replaceAll("-", " ")}
                                    </MenuItem>
                                )
                            )
                        )}
                    </TextField>
                    <Divider />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        color="primary"
                        style={{ textTransform: "none", marginTop: 5 }}
                        disabled={isFetchingLogin}
                    >
                        {isFetchingLogin ? "Logging in..." : "Login"}
                    </Button>
                </form>
            </div>
        </Container>
    );
};

const Form = withFormik({
    enableReinitialize: false,
    mapPropsToValues: (props) => {
        const { username, organization, password } = props;
        return {
            username: username || "",
            organization: organization || "",
            password: password || "",
        };
    },

    validationSchema: yup.object().shape(loginValidationForm),

    handleSubmit: async (values, { props, setSubmitting }) => {
        const { loginUserRequest } = props;
        loginUserRequest(values);
        setSubmitting(false);
    },
})(form);

export default withStyles(styles, { withTheme: true })(Form);
