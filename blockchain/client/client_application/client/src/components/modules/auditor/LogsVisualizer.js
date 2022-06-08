import React from "react";
import Paper from "@material-ui/core/Paper";
import { jsonParser } from "../../../utils/processors/data_processors";
import MUIDataTable from "mui-datatables";
import { CircularProgress, Typography } from "@material-ui/core";
import { Waypoint } from "react-waypoint";
import RequestLogsExtraInfo from "../modals/RequestLogsExtraInfo";
import UpdateLogsExtraInfo from "../modals/UpdateLogsExtraInfo";
import Grid from "@material-ui/core/Grid";

function LogsVisualizer({
    logsType,
    nextAuditLogs,
    auditRequestID,
    metadata,
    auditGetExtraLogsRequest,
    requestAccessLoading,
}) {
    const [rows, setRows] = React.useState([]);
    const requestIDRef = React.useRef();
    const updateRowsRef = React.useRef();
    const currentBookmarkRef = React.useRef({});
    const totalLogsRef = React.useRef(0);

    const updateRequestID = (requestID) => (requestIDRef.current = requestID);
    const updateTotalLogs = (newFetchNr) => {
        if (!totalLogsRef.current) {
            totalLogsRef.current = newFetchNr;
        } else {
            totalLogsRef.current += newFetchNr;
        }
    };
    const updateBookmark = (updatedBookmark) =>
        (currentBookmarkRef.current = updatedBookmark);
    const updateRows = (rowsToAdd, resetRows = false) => {
        if (!resetRows) {
            setRows([...rows, ...rowsToAdd]);
        } else {
            setRows([...rowsToAdd]);
        }
    };
    updateRowsRef.current = updateRows;

    React.useEffect(() => {
        nextAuditLogs.forEach(
            (elem, index) => (nextAuditLogs[index] = jsonParser(elem))
        );
        if (requestIDRef.current !== auditRequestID) {
            updateRowsRef.current(nextAuditLogs, true);
            updateRequestID(auditRequestID);
            updateBookmark(metadata.Bookmark);
        } else {
            if (currentBookmarkRef.current !== metadata.Bookmark) {
                updateTotalLogs(metadata.RecordsCount);
                updateBookmark(metadata.Bookmark);
                updateRowsRef.current(nextAuditLogs);
            }
        }
    }, [updateRowsRef, nextAuditLogs, auditRequestID, metadata]);

    const getNewLogs = () => {
        auditGetExtraLogsRequest({
            requestData: {
                requestID: auditRequestID,
                bookmark: metadata.Bookmark,
            },
        });
    };

    const columns = {
        REQUEST_LOG: [
            {
                label: "Request ID",
                name: "recordInfo",
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
                        if (rowIndex === rows.length - 1) {
                            return (
                                <div
                                    style={{
                                        position: "relative",
                                        height: "20px",
                                    }}
                                >
                                    <div style={parentStyle}>
                                        <div style={cellStyle}>
                                            <Waypoint
                                                // scrollableAncestor={window}
                                                onEnter={() => {
                                                    metadata.extraRecordsProbability &&
                                                        getNewLogs();
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
                                    style={{
                                        position: "relative",
                                        height: "20px",
                                    }}
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
                label: "Domain",
                name: "recordInfo",
                options: {
                    filter: false,
                    sort: true,
                    customBodyRender: (item) => item.parameters.domain,
                },
            },
            {
                label: "Invoker",
                name: "recordInfo",
                options: {
                    filter: false,
                    sort: false,
                    customBodyRender: (item) => item.parameters.invoker,
                },
            },
            {
                label: "Organization MSP",
                name: "recordInfo",
                options: {
                    filter: false,
                    sort: false,
                    customBodyRender: (item) => item.parameters.organization,
                },
            },
            {
                label: "Transaction Details",
                name: "recordData",
                options: {
                    filter: false,
                    sort: false,
                    customBodyRender: (item) => (
                        <RequestLogsExtraInfo logsExtra={item} />
                    ),
                },
            },
        ],
        UPDATE_LOG: [
            {
                label: "Transaction ID",
                name: "recordData",
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
                        if (rowIndex === rows.length - 1) {
                            return (
                                <div
                                    style={{
                                        position: "relative",
                                        height: "20px",
                                    }}
                                >
                                    <div style={parentStyle}>
                                        <div style={cellStyle}>
                                            <Waypoint
                                                onEnter={() => {
                                                    getNewLogs();
                                                }}
                                            />
                                            {item.data.txID}
                                        </div>
                                    </div>
                                </div>
                            );
                        } else {
                            return (
                                <div
                                    style={{
                                        position: "relative",
                                        height: "20px",
                                    }}
                                >
                                    <div style={parentStyle}>
                                        <div style={cellStyle}>
                                            {item.data.txID}
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    },
                },
            },
            {
                label: "Document Type",
                name: "recordInfo",
                options: {
                    filter: false,
                    sort: false,
                    customBodyRender: (item) => item.parameters.docType,
                },
            },
            {
                label: "Domain",
                name: "recordInfo",
                options: {
                    filter: false,
                    sort: false,
                    customBodyRender: (item) => item.parameters.domain,
                },
            },
            {
                label: "Organization",
                name: "recordInfo",
                options: {
                    filter: false,
                    sort: false,
                    customBodyRender: (item) => item.parameters.subject,
                },
            },
            {
                label: "Update Nr.",
                name: "recordInfo",
                options: {
                    filter: false,
                    sort: false,
                    customBodyRender: (item) => item.updateNr,
                },
            },
            {
                label: "Extra",
                name: "recordData",
                options: {
                    filter: false,
                    sort: false,
                    customBodyRender: (item) => {
                        return <UpdateLogsExtraInfo logsExtra={item} />;
                    },
                },
            },
        ],
    };
    const options = {
        filter: false,
        responsive: "scroll",
        filters: false,
        pagination: false,
        selectableRows: false,
        print: false,
        download: false,
        textLabels: {
            body: {
                noMatch: requestAccessLoading ? (
                    <CircularProgress
                        size={24}
                        style={{
                            position: "relative",
                            top: 4,
                        }}
                    />
                ) : (
                    "Sync your audits, then choose a Request ID"
                ),
            },
        },
        resizableColumns: true,
    };

    return (
        <Paper>
            <MUIDataTable
                title={
                    <Grid container justify="space-between">
                        <Grid item xs={12}>
                            <Typography inline variant="h6" align="left">
                                Audit{" "}
                                {requestAccessLoading && rows.length > 0 && (
                                    <CircularProgress
                                        size={24}
                                        style={{
                                            position: "relative",
                                            top: 4,
                                        }}
                                    />
                                )}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography inline variant="body1" align="left">
                                {logsType &&
                                    `${logsType.replace(
                                        "_",
                                        " "
                                    )} | Total fetched: ${
                                        totalLogsRef.current
                                    } | Last fetched: ${metadata.RecordsCount}`}
                            </Typography>
                        </Grid>
                    </Grid>
                }
                data={rows}
                columns={rows.length > 0 ? columns[logsType] : []}
                options={options}
            />
        </Paper>
    );
}

export default LogsVisualizer;
