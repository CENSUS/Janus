import React from "react";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import moment from "moment";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import HighlightOffTwoToneIcon from "@material-ui/icons/HighlightOffTwoTone";
import HourglassEmpty from "@material-ui/icons/HourglassEmpty";
import SyncWithBCExtraInfoModal from "../../modals/SyncWithBCExtraInfo";
import WidgetsIcon from "@material-ui/icons/Widgets";
import MUIDataTable from "mui-datatables";
import {
    CircularProgress,
    LinearProgress,
    Typography,
} from "@material-ui/core";
import { Waypoint } from "react-waypoint";
import { ConstructComponentTitle } from "../../../../utils/processors/common/componentHelper";

const utilizeRecords = (records) =>
    records.map((record) => {
        const modifiedRecord = {};
        Object.assign(modifiedRecord, record);
        modifiedRecord.data = JSON.parse(modifiedRecord.data);
        return modifiedRecord;
    });

function SyncWithBCPanel({
    selectedRequestID,
    syncedBCData = [],
    nextSyncedBCData = [],
    metadata,
    isSyncing,
    getDataRequest,
    syncWithBCClientExtraRequests: acquireExtraRequests,
    reinitialize,
}) {
    const [syncedData, setSyncedData] = React.useState(
        utilizeRecords(syncedBCData)
    );
    const syncedDataRef = React.useRef([]);
    syncedDataRef.current = syncedData;

    const totalRequestsRef = React.useRef(syncedDataRef.current.length);
    const bookmarkRef = React.useRef(metadata.Bookmark || null);

    const updateSyncedData = (nextData, resetRows = false) => {
        if (!resetRows) {
            setSyncedData([
                ...syncedDataRef.current,
                ...utilizeRecords(nextData),
            ]);
        } else {
            setSyncedData([]);
        }
    };

    const updateBookmark = (updatedBookmark) =>
        (bookmarkRef.current = updatedBookmark);

    const updateTotalRequestsNr = (newFetchNr, reset = false) => {
        if (reset) {
            totalRequestsRef.current = 0;
            return;
        }
        if (!totalRequestsRef.current) {
            totalRequestsRef.current = newFetchNr;
        } else {
            totalRequestsRef.current += newFetchNr;
        }
    };

    const getExtraRequests = () => {
        acquireExtraRequests({
            bookmark: metadata.Bookmark,
        });
    };

    const columns = [
        {
            label: "Request ID",
            name: "data",
            options: {
                filter: false,
                sort: false,
                customBodyRender: (item, tableMeta) => {
                    const parentStyle = {
                        position: "absolute",
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        boxSizing: "border-box",
                        display: "block",
                        width: "100%",
                    };
                    const cellStyle = {
                        boxSizing: "border-box",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    };

                    const rowIndex = tableMeta.rowIndex;
                    if (rowIndex === syncedData.length - 1) {
                        return (
                            <div
                                style={{ position: "relative", height: "20px" }}
                            >
                                <div style={parentStyle}>
                                    <div style={cellStyle}>
                                        <Waypoint
                                            onEnter={() => {
                                                metadata.extraRecordsProbability &&
                                                    getExtraRequests();
                                            }}
                                        />
                                        {item.requestID}
                                    </div>
                                </div>
                            </div>
                        );
                    } else {
                        return (
                            <div
                                style={{ position: "relative", height: "20px" }}
                            >
                                <div style={parentStyle}>
                                    <div style={cellStyle}>
                                        {item.requestID}
                                    </div>
                                </div>
                            </div>
                        );
                    }
                },
            },
        },
        {
            label: "Date of Request",
            name: "data",
            options: {
                filter: true,
                sort: true,
                sortOrder: {
                    name: "id",
                    direction: "asc",
                },
                setCellProps: () => ({ style: { whiteSpace: "nowrap" } }),
                customBodyRender: (item) =>
                    moment(new Date(item.invocationTime)).format(
                        `DD MMMM YYYY, HH:mm:ss`
                    ),
            },
        },
        {
            label: "Accessible Until",
            name: "info",
            options: {
                filter: true,
                sort: true,
                sortOrder: {
                    name: "id",
                    direction: "asc",
                },
                setCellProps: () => ({ style: { whiteSpace: "nowrap" } }),
                customBodyRender: (item) =>
                    item.accessibleUntil ? (
                        moment(new Date(item.accessibleUntil)).format(
                            `DD MMMM YYYY, HH:mm:ss`
                        )
                    ) : (
                        <HourglassEmpty />
                    ),
            },
        },
        {
            label: "Transaction Info",
            name: "data",
            options: {
                filter: false,
                sort: false,
                setCellProps: () => ({ style: { whiteSpace: "nowrap" } }),
                customBodyRender: (item) => (
                    <SyncWithBCExtraInfoModal
                        certificates={item.requestDetails.certificates}
                        dataID={item.requestDetails.dataID}
                        txID={item.txID}
                    />
                ),
            },
        },
        {
            label: "Fulfilled",
            name: "info",
            options: {
                filter: false,
                sort: true,
                setCellProps: () => ({ style: { whiteSpace: "nowrap" } }),
                customBodyRender: (item) =>
                    item.fulfilled ? (
                        <CheckCircleIcon />
                    ) : (
                        <HighlightOffTwoToneIcon />
                    ),
            },
        },
        {
            label: "Approved",
            name: "info",
            options: {
                filter: false,
                sort: true,
                setCellProps: () => ({ style: { whiteSpace: "nowrap" } }),
                customBodyRender: (item) =>
                    item.approved ? (
                        <CheckCircleIcon />
                    ) : item.approved === null ? (
                        <WidgetsIcon />
                    ) : (
                        <HighlightOffTwoToneIcon />
                    ),
            },
        },
        {
            label: "Access",
            name: "data",
            options: {
                filter: false,
                sort: false,
                setCellProps: () => ({ style: { whiteSpace: "nowrap" } }),
                customBodyRender: (item) => {
                    const requestID = item.requestID;
                    const dataID = item.requestDetails.dataID;
                    const isActive = selectedRequestID === requestID;
                    return (
                        <Button
                            color="primary"
                            variant="outlined"
                            size="small"
                            style={{ textTransform: "none" }}
                            disabled={isActive}
                            onClick={() =>
                                getDataRequest({ requestID, dataID })
                            }
                        >
                            Access
                        </Button>
                    );
                },
            },
        },
    ];

    React.useEffect(() => {
        if (reinitialize) {
            updateTotalRequestsNr(null, true);
            updateBookmark(null);
            updateSyncedData(null, true);
        }

        if (!reinitialize && bookmarkRef.current !== metadata.Bookmark) {
            updateTotalRequestsNr(metadata.RecordsCount);
            updateBookmark(metadata.Bookmark);
            updateSyncedData(nextSyncedBCData);
        }
    }, [nextSyncedBCData, metadata, reinitialize]);

    const options = {
        pagination: false,
        selectableRows: false,
        resizableColumns: false,
        filterType: "dropdown",
        responsive: "standard",
        search: false,
        print: false,
        download: false,
        tableBodyMaxHeight: "500px",
        textLabels: {
            body: {
                noMatch: isSyncing && (
                    <CircularProgress
                        size={18}
                        style={{
                            position: "relative",
                            top: 4,
                        }}
                    />
                ),
            },
        },
    };

    function LoadingOverlay() {
        return (
            <div
                style={{
                    position: "relative",
                    bottom: 0,
                    width: "100%",
                }}
            >
                <LinearProgress />
            </div>
        );
    }

    return (
        <div>
            <Grid container>
                <Grid item xs={12}>
                    <ConstructComponentTitle title={"Requests"} />
                    <MUIDataTable
                        title={
                            <Grid container justify="space-between">
                                <Grid item xs={12}>
                                    <Typography
                                        inline
                                        variant="body1"
                                        align="left"
                                    >
                                        Total fetched:{" "}
                                        {totalRequestsRef.current || "-"} | Last
                                        fetched: {metadata.RecordsCount || "-"}{" "}
                                        | More requests available:{" "}
                                        {metadata.extraRecordsProbability
                                            ? "Yes"
                                            : "No" || "-"}
                                    </Typography>
                                </Grid>
                                {isSyncing && <LoadingOverlay />}
                            </Grid>
                        }
                        data={syncedData}
                        columns={columns}
                        options={options}
                    />
                </Grid>
            </Grid>
        </div>
    );
}

export default SyncWithBCPanel;
