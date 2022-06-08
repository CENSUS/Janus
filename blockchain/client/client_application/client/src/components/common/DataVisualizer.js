import React from "react";
import { Component } from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Paper from "@material-ui/core/Paper";
import {
    jsonParser,
    PrettyPrintJSON,
} from "../../utils/processors/data_processors";

const useStyles = () => ({
    paper: {
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        height: "100%",
        minHeight: "10vh",
        maxHeight: "300px",
    },
});

const constructData = (data) => jsonParser(data);

class DataVisualizer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: null,
        };
    }
    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.data !== this.state.data;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (prevState.data !== nextProps.data) {
            return {
                data: nextProps.data,
            };
        }
    }

    render() {
        const { classes } = this.props;
        const constructedData = constructData(this.state.data);
        return (
            <Paper className={classes.paper}>
                {this.state.data ? (
                    typeof constructedData === "object" ? (
                        <PrettyPrintJSON data={constructedData} />
                    ) : (
                        <p>{constructedData}</p>
                    )
                ) : (
                    "No data"
                )}
            </Paper>
        );
    }
}

export default withStyles(useStyles, { withTheme: true })(DataVisualizer);
