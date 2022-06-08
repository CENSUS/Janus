import React from "react";
import { makeStyles } from "@material-ui/styles";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { GridOverlay, DataGrid } from "@material-ui/data-grid";
import LinearProgress from "@material-ui/core/LinearProgress";
import Button from "@material-ui/core/Button";
import moment from "moment";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import HighlightOffTwoToneIcon from "@material-ui/icons/HighlightOffTwoTone";
import { jsonParser } from "../../../utils/processors/data_processors";

const useStyles = makeStyles((theme) => ({
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
    list: {
        width: "100%",
        backgroundColor: theme.palette.common.white,
        position: "relative",
        overflow: "auto",
        maxHeight: 500,
    },
    listSection: {
        backgroundColor: "inherit",
    },
    ul: {
        backgroundColor: "inherit",
        padding: 0,
    },
    menuButton: {
        marginRight: 36,
    },
    menuButtonHidden: {
        display: "none",
    },
    table: {
        width: "100%",
    },
    paper: {
        padding: theme.spacing(1),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        marginBottom: theme.spacing(2),
        margin: "auto",
    },
    fixedHeight: {
        height: 240,
    },
    title: {
        flex: "1 1 100%",
        color: theme.palette.common.white,
        backgroundColor: theme.palette.primary.main,
    },
    submitButton: {
        margin: theme.spacing(3, 0, 2),
        backgroundColor: "#184e77",
        color: "#fff",
        "&:hover": {
            backgroundColor: "#245d88",
            borderColor: "#184E77",
        },
    },
    dataGrid: {
        "& .custom-cell-theme--cell": {
            backgroundColor: "rgba(224, 183, 60, 0.55)",
            color: "#1a3e72",
            fontWeight: "600",
        },
        "& .custom-cell.negative": {
            backgroundColor: "#cc6b7b",
            color: "#1a3e72",
            fontWeight: "600",
        },
        "& .custom-cell.positive": {
            backgroundColor: "#8bff7a",
            color: "#1a3e72",
            fontWeight: "600",
        },
        "& .custom-cell.examining": {
            backgroundColor: "yellow",
            color: "#1a3e72",
            fontWeight: "600",
        },
    },
}));

const columns = [
    {
        field: "",
        headerName: "Access",
        width: 140,
        headerAlign: "center",
        align: "center",
        renderCell: ({ api: { componentsProps }, row: { nonce } }) => {
            const { auditGetLogsRequest, currentAuditRequestID } =
                componentsProps;
            return (
                <Button
                    color="primary"
                    style={{ textTransform: "none" }}
                    onClick={() =>
                        auditGetLogsRequest({
                            requestData: { requestID: nonce },
                        })
                    }
                    disabled={currentAuditRequestID === nonce}
                >
                    Access
                </Button>
            );
        },
    },
    {
        field: "type",
        headerName: "Request Type",
        width: 180,
        headerAlign: "center",
        align: "center",
        renderCell: ({ value }) => {
            return <b>{value.toUpperCase().replace("_", " ")}</b>;
        },
    },
    {
        field: "nonce",
        headerName: "Request ID",
        width: 180,
        headerAlign: "center",
        align: "center",
        renderHeader: () => <strong>Request ID</strong>,
    },
    {
        field: "audience",
        headerName: "Audience",
        width: 180,
        headerAlign: "center",
        align: "center",
    },
    {
        field: "status",
        headerName: "Completed",
        width: 160,
        headerAlign: "center",
        align: "center",
        renderCell: ({ value }) => {
            return value ? <CheckCircleIcon /> : <HighlightOffTwoToneIcon />;
        },
    },
    {
        field: "approved",
        headerName: "Access Approved",
        width: 180,
        headerAlign: "center",
        align: "center",
        renderCell: ({ value }) => {
            return value ? <CheckCircleIcon /> : <HighlightOffTwoToneIcon />;
        },
    },
    {
        field: "validUntil",
        headerName: "Accessible Until",
        width: 180,
        headerAlign: "center",
        align: "center",
        valueFormatter: ({ value }) =>
            value ? moment(value).format(`MMM Do YYYY, HH:mm:ss`) : "-",
    },
];

function LoadingOverlay() {
    return (
        <GridOverlay>
            <div style={{ position: "absolute", bottom: 0, width: "100%" }}>
                <LinearProgress />
            </div>
        </GridOverlay>
    );
}

function SyncAuditsPanel({
    retrieveLogsLoading,
    auditorAudits,
    auditGetLogsRequest,
    currentAuditRequestID,
}) {
    const classes = useStyles();
    const [currentAudits, setCurrentAudits] = React.useState([]);

    auditorAudits.forEach(
        (audit, index) => (auditorAudits[index] = jsonParser(audit))
    );

    React.useEffect(() => {
        if (auditorAudits !== currentAudits) {
            const modifiedAudits = auditorAudits.map((audit) =>
                jsonParser(audit)
            );
            setCurrentAudits(modifiedAudits);
        }
    }, [auditorAudits]);

    return (
        <div>
            <Grid container>
                <Grid item xs={12}>
                    <Paper className={classes.paper}>
                        <div style={{ height: 400, width: "100%" }}>
                            <div style={{ display: "flex", height: "100%" }}>
                                <div style={{ flexGrow: 1 }}>
                                    <DataGrid
                                        components={{
                                            LoadingOverlay: LoadingOverlay,
                                        }}
                                        componentsProps={{
                                            auditGetLogsRequest,
                                            currentAuditRequestID,
                                        }}
                                        pagination
                                        loading={retrieveLogsLoading}
                                        rows={currentAudits}
                                        columns={columns}
                                        pageSize={5}
                                        getRowId={(row) => row.nonce}
                                    />
                                </div>
                            </div>
                        </div>
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
}

export default SyncAuditsPanel;
