import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Paper from "@material-ui/core/Paper";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import Tooltip from "@material-ui/core/Tooltip";
import { withFormik } from "formik";
import AttachFile from "@material-ui/icons/AttachFile";
import AddIcon from "@material-ui/icons/Add";
import DataVisualizer from "../../common/DataVisualizer";
import {
    ConstructComponentTitle,
    GridDivider,
} from "../../../utils/processors/common/componentHelper";

const styles = () => ({
    card: {},
    visualizerCard: {
        overflow: "auto",
        minHeight: "60vh",
        maxHeight: "60vh",
    },
    actions: {
        display: "Flex",
        justifyContent: "center",
    },
    paper: {
        height: "100%",
        borderRadius: "0",
    },
});

const AddCAForm = (props) => {
    const {
        classes,
        values,
        touched,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
    } = props;

    const updateFileData = (event, dataID) => {
        const file = event.currentTarget.files[0];
        let reader = new FileReader();
        reader.readAsText(file, "utf-8");
        reader.onload = (r) => {
            setFieldValue(dataID, r.target.result);
        };
        setFieldValue(event.currentTarget.id, event.currentTarget.files[0]);
    };

    const canSubmit =
        values.orgMSP &&
        values.certificateFileData &&
        values.crlFileData &&
        values.aclFileData;

    return (
        <Grid container spacing={1}>
            <Grid item xs={3} md={3} lg={3}>
                <Paper className={classes.paper}>
                    <ConstructComponentTitle title="Add CA" />
                    <form onSubmit={handleSubmit}>
                        <Card className={classes.card}>
                            <CardContent>
                                <TextField
                                    id="orgMSP"
                                    label="Organization MSP"
                                    value={values.orgMSP}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    helperText={
                                        touched.orgMSP ? errors.orgMSP : ""
                                    }
                                    error={
                                        touched.orgMSP && Boolean(errors.orgMSP)
                                    }
                                    margin="dense"
                                    variant="outlined"
                                    fullWidth
                                />
                                <Divider />
                                <input
                                    type="file"
                                    id="certificateFile"
                                    onChange={(event) => {
                                        updateFileData(
                                            event,
                                            "certificateFileData"
                                        );
                                    }}
                                    name="certificateFile"
                                    accept=".pem"
                                    hidden
                                />
                                <Tooltip title="Accepts PEM-encoded files">
                                    <label htmlFor="certificateFile">
                                        <Button
                                            color="primary"
                                            component="span"
                                            //onClick={() => handleRegister()}
                                            style={{ textTransform: "none" }}
                                        >
                                            <AttachFile />
                                            Select Certificate
                                        </Button>
                                    </label>
                                </Tooltip>
                                <br />
                                <label>
                                    File:{" "}
                                    {values.certificateFile
                                        ? values.certificateFile.name || "Error"
                                        : "None"}
                                </label>
                                <br />
                                <label>
                                    Filesize:{" "}
                                    {values.certificateFile
                                        ? values.certificateFile.size || "Error"
                                        : "-"}{" "}
                                    bytes
                                </label>
                                <Divider />
                                <input
                                    type="file"
                                    id="crlFile"
                                    onChange={(event) => {
                                        updateFileData(event, "crlFileData");
                                    }}
                                    name="crlFile"
                                    accept=".pem"
                                    hidden
                                />
                                <Tooltip title="Accepts PEM-encoded files">
                                    <label htmlFor="crlFile">
                                        <Button
                                            color="primary"
                                            component="span"
                                            style={{ textTransform: "none" }}
                                        >
                                            <AttachFile />
                                            Select CRL
                                        </Button>
                                    </label>
                                </Tooltip>
                                <br />
                                <label>
                                    File:{" "}
                                    {values.crlFile
                                        ? values.crlFile.name || "Error"
                                        : "None"}
                                </label>
                                <br />
                                <label>
                                    Filesize:{" "}
                                    {values.crlFile
                                        ? values.crlFile.size || "Error"
                                        : "-"}{" "}
                                    bytes
                                </label>
                                <Divider />
                                <input
                                    type="file"
                                    id="aclFile"
                                    onChange={(event) => {
                                        updateFileData(event, "aclFileData");
                                    }}
                                    name="aclFile"
                                    accept="application/JSON"
                                    hidden
                                />
                                <Tooltip title="Accepts JSON files">
                                    <label htmlFor="aclFile">
                                        <Button
                                            color="primary"
                                            component="span"
                                            style={{ textTransform: "none" }}
                                        >
                                            <AttachFile />
                                            Select ACL
                                        </Button>
                                    </label>
                                </Tooltip>
                                <br />
                                <label>
                                    File:{" "}
                                    {values.aclFile
                                        ? values.aclFile.name || "Error"
                                        : "None"}
                                </label>
                                <br />
                                <label>
                                    Filesize:{" "}
                                    {values.aclFile
                                        ? values.aclFile.size || "Error"
                                        : "-"}{" "}
                                    bytes
                                </label>
                                <Divider />
                            </CardContent>
                            <CardActions className={classes.actions}>
                                <Tooltip title="It will initialize an Election to append a new CA to the existing CAs of the Blockchain">
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AddIcon />}
                                        disabled={!canSubmit}
                                        style={{ textTransform: "none" }}
                                    >
                                        Submit CA
                                    </Button>
                                </Tooltip>
                            </CardActions>
                        </Card>
                    </form>
                </Paper>
            </Grid>
            <Grid item xs={9} md={9} lg={9}>
                <Card className={classes.visualizerCard}>
                    <CardContent>
                        <ConstructComponentTitle title={"Certificate File"} />
                        <DataVisualizer data={values.certificateFileData} />
                        <GridDivider />
                        <ConstructComponentTitle title={"CRL File"} />
                        <DataVisualizer data={values.crlFileData} />
                        <GridDivider />
                        <ConstructComponentTitle title={"ACL File"} />
                        <DataVisualizer data={values.aclFileData} />
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

const Form = withFormik({
    enableReinitialize: false,
    mapPropsToValues: (props) => {
        const {
            orgMSP,
            certificateFile,
            certificateFileData,
            crlFile,
            crlFileData,
            aclFile,
            aclFileData,
        } = props;
        return {
            certificateFile: certificateFile || null,
            certificateFileData: certificateFileData || null,
            crlFile: crlFile || null,
            crlFileData: crlFileData || null,
            aclFile: aclFile || null,
            aclFileData: aclFileData || null,
            orgMSP: orgMSP || null,
        };
    },

    //validationSchema: yup.object().shape(votingValidationForm),

    handleSubmit: async (values, { props, setSubmitting }) => {
        const { addCARequest: submitToAPI } = props;
        const payload = [
            values.orgMSP,
            values.certificateFileData,
            values.crlFileData,
            values.aclFileData,
        ];

        submitToAPI(payload);
    },
})(AddCAForm);

export default withStyles(styles, { withTheme: true })(Form);
