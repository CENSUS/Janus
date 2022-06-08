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

const setDataIDExtracted = (dataID) => {
    let _dataID = dataID;
    if (typeof dataID === "string") _dataID = jsonParser(dataID);
    return extractInfoFromDataIDRequest(_dataID);
};

const setCertificates = (certificates) => {
    const parsedCertificates =
        typeof certificates === "string"
            ? jsonParser(certificates)
            : certificates;

    return parsedCertificates.map((certificate) =>
        Buffer.from(certificate, "base64").toString("utf-8")
    );
};

function SyncWithBCExtraInfoModal({ certificates = [], dataID, txID }) {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const certificatesRef = React.useRef(setCertificates(certificates));
    const dataIDExtractedRef = React.useRef(setDataIDExtracted(dataID));
    const txIDRef = React.useRef(txID);
    const handleModalState = () => {
        setOpen(!open);
    };

    return (
        <div>
            <Button onClick={handleModalState}>
                <AssignmentIcon />
            </Button>
            <Dialog
                open={open}
                onClose={handleModalState}
                scroll={"paper"}
                aria-labelledby="requestExtraInfo"
                aria-describedby="requestExtraInfo Dialog"
            >
                <DialogTitle id="requestExtraInfo-title">
                    <ConstructComponentTitle title="Request Inspection" />
                </DialogTitle>
                <DialogContent dividers={true}>
                    <Container maxWidth="sm">
                        <Grid container direction="column" alignItems="center">
                            <Grid item xs={12}>
                                <b>Transaction ID</b>
                            </Grid>
                            <Grid item xs={12}>
                                {txIDRef.current || "undefined"}
                            </Grid>
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
                                        <ul
                                            key={`section-certificates-ul`}
                                            className={classes.ul}
                                        >
                                            {certificatesRef.current.map(
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
                                                {dataIDExtractedRef.current.dataID.map(
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
                                                            key={`section-parameters-ul`}
                                                            className={
                                                                classes.ul
                                                            }
                                                        >
                                                            {dataIDExtractedRef.current.parameters.map(
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
                                                    dataIDExtractedRef.current
                                                        .organization.name ||
                                                    dataIDExtractedRef.current
                                                        .organization
                                                }`}
                                                &nbsp;
                                                {dataIDExtractedRef.current
                                                    .organization.name &&
                                                    `(UUID: ${dataIDExtractedRef.current.organization.uuid})`}
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

export default SyncWithBCExtraInfoModal;
