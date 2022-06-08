import React, { Component } from "react";
import {
    withStyles,
    Card,
    CardContent,
    TextField,
    Grid,
    MenuItem,
} from "@material-ui/core";

import IdentityToggler from "../../../../containers/client/ActiveIdentitiesList";

import {
    Data00,
    Data01,
    Data02,
    Data03,
    Data04,
} from "../../../../containers/client/data/DataIDs";
import { ConstructComponentTitle } from "../../../../utils/processors/common/componentHelper";

const styles = (theme) => ({
    card: {
        maxWidth: 420,
        marginTop: 8,
    },
    container: {
        display: "Flex",
        justifyContent: "center",
    },
    actions: {
        display: "Flex",
        justifyContent: "center",
    },
    dividerHorizontal: {
        background: "#ababab",
        variant: "middle",
        margin: "7px 0 7px 0",
    },
    formLoginButton: {
        margin: theme.spacing(3, 0, 2),
        backgroundColor: "#184e77",
        color: "#fff",
        "&:hover": {
            backgroundColor: "#245d88",
            borderColor: "#184E77",
        },
    },
});

class RequestAccess extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedDataID: props.availableDataRequests[0].value,
            availableDataRequests: props.availableDataRequests,
        };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        this.setState({
            selectedDataID: e.target.value,
        });
    }

    renderForm(id) {
        switch (id) {
            case "data_00":
                return <Data00 dataID={id} />;
            case "data_01":
                return <Data01 dataID={id} />;
            case "data_02":
                return <Data02 dataID={id} />;
            case "data_03":
                return <Data03 dataID={id} />;
            case "data_04":
                return <Data04 dataID={id} />;
            default:
                return null;
        }
    }

    render() {
        const classes = this.props.classes;
        return (
            <Grid container direction="column" spacing={1}>
                <Grid item sm={12}>
                    <form>
                        <Card className={classes.card}>
                            <ConstructComponentTitle title="Make A Request" />
                            <CardContent>
                                <TextField
                                    select
                                    id="dataID"
                                    label="Query"
                                    value={this.state.selectedDataID}
                                    onChange={this.handleChange}
                                    margin="dense"
                                    variant="outlined"
                                    fullWidth
                                >
                                    {this.state.availableDataRequests.map(
                                        (option) => (
                                            <MenuItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.name}
                                            </MenuItem>
                                        )
                                    )}
                                </TextField>
                            </CardContent>
                        </Card>
                    </form>
                </Grid>
                {this.renderForm(this.state.selectedDataID)}
                <Grid item sm={12} zeroMinWidth>
                    <IdentityToggler />
                </Grid>
            </Grid>
        );
    }
}

export default withStyles(styles, { withTheme: true })(RequestAccess);
