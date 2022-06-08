import React from "react";
import { makeStyles } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import { GridOverlay, DataGrid } from "@material-ui/data-grid";
import LinearProgress from "@material-ui/core/LinearProgress";
import moment from "moment";
import { Button, ButtonGroup } from "@material-ui/core";

const ButtonGroupGen = (electionID, challengeData, castBallotFcn) => {
    return (
        <ButtonGroup
            variant="contained"
            color="primary"
            aria-label="contained primary button group"
        >
            <Button
                onClick={() => {
                    castBallotFcn({
                        electionID,
                        challengeData,
                        approved: true,
                    });
                }}
            >
                Approve
            </Button>
            <Button
                onClick={() => {
                    castBallotFcn({
                        electionID,
                        challengeData,
                        approved: false,
                    });
                }}
            >
                Decline
            </Button>
        </ButtonGroup>
    );
};
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
        field: "validUntil",
        headerName: "Closes",
        width: 180,
        headerAlign: "center",
        align: "center",
        valueFormatter: ({ value }) =>
            moment(value).format(`MMM Do YYYY, HH:mm:ss`),
    },
    {
        field: "",
        headerName: "Cast Ballot",
        width: 200,
        headerAlign: "center",
        align: "center",
        sortable: false,
        renderCell: ({
            api: { componentsProps },
            row: { electionID, challengeData },
        }) => {
            const { castBallotRequest } = componentsProps;
            return ButtonGroupGen(electionID, challengeData, castBallotRequest);
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

function PendingElections({
    elections,
    syncingElections,
    castBallotRequest,
    castingBallotLoading,
}) {
    const classes = useStyles();

    return (
        <Paper className={classes.paper}>
            <Typography variant="h6" component="h2" gutterBottom>
                Ready to Vote
            </Typography>
            <div style={{ height: 400, width: "100%" }}>
                <div style={{ display: "flex", height: "100%" }}>
                    <div style={{ flexGrow: 1 }}>
                        <DataGrid
                            components={{
                                LoadingOverlay: LoadingOverlay,
                            }}
                            componentsProps={{
                                castBallotRequest,
                            }}
                            loading={syncingElections || castingBallotLoading}
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

export default PendingElections;
