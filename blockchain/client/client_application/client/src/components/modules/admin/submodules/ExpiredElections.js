import React from "react";
import { makeStyles } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import { GridOverlay, DataGrid } from "@material-ui/data-grid";
import LinearProgress from "@material-ui/core/LinearProgress";
import moment from "moment";
import { Typography } from "@material-ui/core";
import clsx from "clsx";
import ElectionsExtraInfo from "../../../../containers/admin/elections/ElectionsExtraInfo";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import HighlightOffTwoToneIcon from "@material-ui/icons/HighlightOffTwoTone";

const useStyles = makeStyles((theme) => ({
    paper: {
        padding: theme.spacing(1),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        marginBottom: theme.spacing(2),
        margin: "auto",
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
        field: "electionID",
        sortable: false,
        width: 270,
        headerAlign: "center",
        align: "center",
        renderHeader: (params) => <strong>Election ID</strong>,
    },
    {
        field: "electionType",
        sortable: false,
        width: 270,
        headerAlign: "center",
        align: "center",
        renderHeader: (params) => <strong>Election Type</strong>,
        renderCell: ({ value }) => {
            return value.toUpperCase();
        },
    },
    {
        field: "creator",
        sortable: false,
        width: 270,
        headerAlign: "center",
        align: "center",
        renderHeader: (params) => <strong>Initiator</strong>,
    },
    {
        field: "comment",
        sortable: false,
        width: 270,
        headerAlign: "center",
        align: "center",
        renderHeader: (params) => <strong>Election Information</strong>,
    },
    {
        field: "audience",
        headerName: "Audience",
        width: 180,
        headerAlign: "center",
        align: "center",
    },
    {
        field: "",
        headerName: "Inspection",
        width: 150,
        headerAlign: "center",
        align: "center",
        sortable: false,
        renderCell: ({ row: { electionID } }) => {
            return <ElectionsExtraInfo electionID={electionID} />;
        },
    },
    {
        field: "validUntil",
        headerName: "Ended at",
        width: 180,
        headerAlign: "center",
        align: "center",
        valueFormatter: ({ value }) =>
            moment(value).format(`MMM Do YYYY, HH:mm:ss`),
    },
    {
        field: "approved",
        headerName: "Approved",
        width: 140,
        headerAlign: "center",
        align: "center",
        cellClassName: (params) =>
            clsx("custom-cell", {
                negative: !params.value,
                positive: params.value,
            }),
        renderCell: ({ value }) => {
            return value ? <CheckCircleIcon /> : <HighlightOffTwoToneIcon />;
        },
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

function OnGoingElections({ elections, syncingElections }) {
    const classes = useStyles();

    return (
        <Paper className={classes.paper}>
            <Typography variant="h6" component="h2" gutterBottom>
                Expired Elections
            </Typography>
            <div style={{ height: 400, width: "100%" }}>
                <div style={{ display: "flex", height: "100%" }}>
                    <div style={{ flexGrow: 1 }}>
                        <DataGrid
                            components={{
                                LoadingOverlay: LoadingOverlay,
                            }}
                            loading={syncingElections}
                            rows={elections}
                            columns={columns}
                            pageSize={5}
                            getRowId={(row) => row.electionID}
                        />
                    </div>
                </div>
            </div>
        </Paper>
    );
}

export default OnGoingElections;
