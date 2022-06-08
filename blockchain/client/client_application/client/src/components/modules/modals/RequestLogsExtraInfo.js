import React from "react";
import { makeStyles } from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import ListSubheader from "@material-ui/core/ListSubheader";
import Table from "@material-ui/core/Table";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import Container from "@material-ui/core/Container";
import AssignmentIcon from "@material-ui/icons/Assignment";
import {
    extractInfoFromDataIDRequest,
    jsonParser,
} from "../../../utils/processors/data_processors";
import InspectCertificate from "../common/InspectCertificate";
import { ConstructComponentTitle } from "../../../utils/processors/common/componentHelper";

const useStyles = makeStyles((theme) => ({
    modal: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    paper: {
        backgroundColor: theme.palette.background.paper,
        border: "none",
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
    },
    list: {
        width: "100%",
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        overflow: "auto",
        maxHeight: 300,
    },
    listSection: {
        backgroundColor: "inherit",
        width: "100%",
    },
    ul: {
        backgroundColor: "inherit",
        padding: 0,
    },
    subheader: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
    },
    certificates: {
        width: "100%",
    },
}));

const baseInfo = [
    { name: "Request ID", value: "requestID" },
    { name: "Transaction ID", value: "txID" },
    { name: "Invoker", value: "invoker" },
    { name: "Invocation Time", value: "invocationTime" },
];

const extraInfo = [
    { name: "Fulfilled", value: "fulfilled" },
    { name: "Approved", value: "approved" },
];
function RequestLogsExtraInfo({ logsExtra }) {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const [logData, setLogData] = React.useState({});

    const handleModalState = () => {
        setOpen(!open);
    };

    const { data, info } = logsExtra;

    if (Object.keys(logData).length === 0)
        if (typeof data === "string") setLogData(jsonParser(data));

    const nestedData = jsonParser(data);

    const dataIDExtracted = extractInfoFromDataIDRequest(
        jsonParser(nestedData.requestDetails.dataID)
    );

    const certificatesFromData = jsonParser(
        nestedData.requestDetails.certificates
    );

    const certificates = certificatesFromData.map((certificate) =>
        Buffer.from(certificate, "base64").toString("utf-8")
    );

    return (
        <div>
            <Button onClick={handleModalState}>
                <AssignmentIcon />
            </Button>
            <Dialog
                open={open}
                onClose={handleModalState}
                scroll={"paper"}
                aria-labelledby="requestLogsExtraInfo"
                aria-describedby="requestLogsExtraInfo Dialog"
            >
                <DialogTitle id="requestLogsExtraInfo-title">
                    <ConstructComponentTitle title="Log Inspection" />
                </DialogTitle>
                <DialogContent dividers={true}>
                    <Container maxWidth="sm">
                        <Grid
                            container
                            xs={12}
                            direction="column"
                            justifyContent="center"
                            alignItems="center"
                        >
                            {baseInfo.map((item) => {
                                return (
                                    <>
                                        <Grid item xs={12}>
                                            <b>{item.name}</b>
                                        </Grid>
                                        <Grid item xs={12}>
                                            {logData[item.value] || "undefined"}
                                        </Grid>
                                    </>
                                );
                            })}
                            {extraInfo.map((item) => {
                                return (
                                    <>
                                        <Grid item xs={12}>
                                            <b>{item.name}</b>
                                        </Grid>
                                        <Grid item xs={12}>
                                            {!info[item.value] ? "No" : "Yes"}
                                        </Grid>
                                    </>
                                );
                            })}
                            <ConstructComponentTitle title="Certificates" />
                            <Grid item xs={12}>
                                <List
                                    className={classes.list}
                                    subheader={<li />}
                                >
                                    <li
                                        key={`section-certificates`}
                                        className={classes.listSection}
                                    >
                                        <ul className={classes.ul}>
                                            {certificates.map(
                                                (certificate, index) => (
                                                    <div>
                                                        <ListSubheader
                                                            className={
                                                                classes.subheader
                                                            }
                                                        >{`Certificate ${
                                                            index + 1
                                                        }`}</ListSubheader>
                                                        <InspectCertificate
                                                            certificate={
                                                                certificate
                                                            }
                                                        />
                                                    </div>
                                                )
                                            )}
                                        </ul>
                                    </li>
                                </List>
                            </Grid>
                            <Grid item xs={12}>
                                <Divider />
                            </Grid>
                            <ConstructComponentTitle title="Information" />
                            <Grid item xs={12}>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableRow>
                                            <TableCell variant="head">
                                                Data ID
                                            </TableCell>
                                            <TableCell>
                                                {dataIDExtracted.dataID.map(
                                                    (id) => {
                                                        return `${id.name} (Type: ${id.value})`;
                                                    }
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell variant="head">
                                                Parameters
                                            </TableCell>
                                            <TableCell>
                                                <List
                                                    className={classes.list}
                                                    style={{
                                                        height: "50px",
                                                    }}
                                                    subheader={<li />}
                                                >
                                                    <li
                                                        key={`section-parameters`}
                                                        className={
                                                            classes.listSection
                                                        }
                                                    >
                                                        <ul
                                                            className={
                                                                classes.ul
                                                            }
                                                        >
                                                            {dataIDExtracted.parameters.map(
                                                                (object) =>
                                                                    Object.keys(
                                                                        object
                                                                    )
                                                                        .filter(
                                                                            (
                                                                                elem
                                                                            ) =>
                                                                                object[
                                                                                    elem
                                                                                ]
                                                                                    .length >
                                                                                0
                                                                        )
                                                                        .map(
                                                                            (
                                                                                elem
                                                                            ) => {
                                                                                return (
                                                                                    <div>{`${elem}: ${object[elem]}`}</div>
                                                                                );
                                                                            }
                                                                        )
                                                            )}
                                                        </ul>
                                                    </li>
                                                </List>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell variant="head">
                                                Organization
                                            </TableCell>
                                            <TableCell>
                                                {`${
                                                    dataIDExtracted.organization
                                                        .name ||
                                                    dataIDExtracted.organization
                                                }`}
                                                &nbsp;
                                                {dataIDExtracted.organization
                                                    .name &&
                                                    `(UUID: ${dataIDExtracted.organization.uuid})`}
                                            </TableCell>
                                        </TableRow>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    </Container>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleModalState} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default RequestLogsExtraInfo;
