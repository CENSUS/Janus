import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Card from "@material-ui/core/Card";
import Paper from "@material-ui/core/Paper";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import Tooltip from "@material-ui/core/Tooltip";
import { withFormik } from "formik";
import { AttachFile } from "@material-ui/icons";
import DataVisualizer from "../../common/DataVisualizer";
import UpdateIcon from "@material-ui/icons/Update";
import { ConstructComponentTitle } from "../../../utils/processors/common/componentHelper";

const styles = (theme) => ({
    card: {},
    container: {
        display: "Flex",
        justifyContent: "center",
    },
    visualizerCard: {
        overflow: "hidden",
        minHeight: "100%",
        maxHeight: "70vh",
    },
    actions: {
        display: "Flex",
        justifyContent: "center",
    },
    form: {
        width: "100%",
    },
    paper: {
        height: "100%",
        borderRadius: "0",
    },
});

const TrustAnchorsForm = (props) => {
    const { classes, values, handleSubmit, setFieldValue } = props;

    const updateFileData = (event, dataID) => {
        const file = event.currentTarget.files[0];
        let reader = new FileReader();
        reader.readAsText(file, "utf-8");
        reader.onload = (r) => {
            setFieldValue(dataID, r.target.result);
        };
        setFieldValue(event.currentTarget.id, event.currentTarget.files[0]);
    };

    const canSubmit = values.trustAnchorsFile;

    return (
        <Grid container spacing={1}>
            <Grid item xs={3} md={3} lg={3}>
                <Paper className={classes.paper}>
                    <ConstructComponentTitle title="Update Trust Anchors" />
                    <form onSubmit={handleSubmit} className={classes.form}>
                        <Card className={classes.card}>
                            <CardContent>
                                <input
                                    type="file"
                                    id="trustAnchorsFile"
                                    onChange={(event) => {
                                        updateFileData(
                                            event,
                                            "trustAnchorsFileData"
                                        );
                                    }}
                                    name="trustAnchorsFile"
                                    accept=".pem, application/JSON"
                                    hidden
                                />
                                <Tooltip title="Accepts JSON and PEM files">
                                    <label htmlFor="trustAnchorsFile">
                                        <Button
                                            color="primary"
                                            component="span"
                                            style={{ textTransform: "none" }}
                                        >
                                            <AttachFile />
                                            Select file
                                        </Button>
                                    </label>
                                </Tooltip>
                                <br />
                                <label>
                                    File:{" "}
                                    {values.trustAnchorsFile
                                        ? values.trustAnchorsFile.name ||
                                          "Error"
                                        : "None"}
                                </label>
                                <br />
                                <label>
                                    Filesize:{" "}
                                    {values.trustAnchorsFile
                                        ? values.trustAnchorsFile.size ||
                                          "Error"
                                        : "-"}{" "}
                                    bytes
                                </label>
                                <Divider />
                            </CardContent>
                            <CardActions className={classes.actions}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    startIcon={<UpdateIcon />}
                                    disabled={!canSubmit}
                                    style={{ textTransform: "none" }}
                                >
                                    Update
                                </Button>
                            </CardActions>
                        </Card>
                    </form>
                </Paper>
            </Grid>
            <Grid item xs={9} md={9} lg={9}>
                <Card className={classes.visualizerCard}>
                    <ConstructComponentTitle title={"File"} />
                    <DataVisualizer data={values.trustAnchorsFileData} />
                </Card>
            </Grid>
        </Grid>
    );
};

const Form = withFormik({
    enableReinitialize: false,
    mapPropsToValues: (props) => {
        const { trustAnchorsFile, trustAnchorsFileData } = props;
        return {
            trustAnchorsFile: trustAnchorsFile || null,
            trustAnchorsFileData: trustAnchorsFileData || "",
        };
    },

    //validationSchema: yup.object().shape(votingValidationForm),

    handleSubmit: async (values, { props, setSubmitting }) => {
        const { updateTrustAnchorsRequest: submitToAPI } = props;
        const payload = { data: values.trustAnchorsFileData };

        submitToAPI(payload);
        setSubmitting(false);
    },
})(TrustAnchorsForm);

export default withStyles(styles, { withTheme: true })(Form);
