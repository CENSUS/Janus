import React, { Component } from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import RegisterUserForm from "../../containers/admin/register/RegisterUserForm";
import RegisterUserSubmit from "../../containers/admin/register/RegisterUserApproval";
import { withRouter } from "react-router-dom";

const styles = (theme) => ({
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
});

class Users extends Component {
    constructor(props) {
        super(props);

        this.state = {
            formData: [],
        };
    }

    handleNewFormData = (extraData) => {
        const data = JSON.parse(...extraData);
        this.setState((prevState) => ({
            formData: [...prevState.formData, data],
        }));
    };

    removeFromFormData = (enrollmentID) => {
        const enrollmentIDIndex = () =>
            this.state.formData.findIndex(
                (elem) => elem.enrollmentID === enrollmentID
            );

        this.state.formData.splice(enrollmentIDIndex(), 1);

        this.setState({
            formData: this.state.formData,
        });
    };

    render() {
        const { classes } = this.props;

        return (
            <Container maxWidth="lg" className={classes.container}>
                <Grid
                    container
                    justify="space-around"
                    spacing={4}
                    component={Paper}
                >
                    {/* RegisterUserForm */}
                    <Grid item xs={4}>
                        <RegisterUserForm />
                    </Grid>
                    {/* RegisterUserSubmit */}
                    <Grid item xs={8}>
                        <RegisterUserSubmit />
                    </Grid>
                </Grid>
            </Container>
        );
    }
}

export default withRouter(withStyles(styles, { withTheme: true })(Users));
