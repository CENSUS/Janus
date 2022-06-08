import React from "react";
import { makeStyles } from "@material-ui/core";
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
import { GridOverlay } from "@material-ui/data-grid";
import { LinearProgress } from "@material-ui/core";
import Election from "../../../utils/objects/election";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { humanReadableIdentifier } from "../../../utils/processors/data_processors";
import { ConstructComponentTitle } from "../../../utils/processors/common/componentHelper";

const valueToReadable = (value, isBoolean, isSpecialBoolean = false) =>
    value
        ? isBoolean || isSpecialBoolean
            ? "YES"
            : value
        : isBoolean
        ? "NO"
        : "-";

const useStyles = makeStyles((theme) => ({
    modal: {
        position: "absolute",
        top: "10%",
        left: "10%",
        overflow: "hidden",
        height: "100%",
        maxHeight: 500,
        display: "block",
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
        maxHeight: 270,
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
}));

function LoadingOverlay() {
    return (
        <GridOverlay>
            <div style={{ position: "relative", top: 0, width: "100%" }}>
                <LinearProgress />
            </div>
        </GridOverlay>
    );
}

function SyncWithBCExtraInfoModal({
    electionID,
    electionsExtraInfo,
    syncWithBCElectionsExtraInfoRequest,
}) {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const [electionData, setElectionData] = React.useState({});
    const [ballotData, setBallotData] = React.useState({});

    React.useEffect(() => {
        open && syncWithBCElectionsExtraInfoRequest(electionID);
    }, [open, electionID, syncWithBCElectionsExtraInfoRequest]);

    React.useEffect(() => {
        if (electionsExtraInfo[electionID]) {
            electionsExtraInfo[electionID]["electionData"] &&
                setElectionData(
                    new Election(electionsExtraInfo[electionID]["electionData"])
                );

            electionsExtraInfo[electionID]["ballotData"] &&
                setBallotData(electionsExtraInfo[electionID]["ballotData"]);
        }
    }, [electionID, electionsExtraInfo]);

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
                aria-labelledby="electionsExtraInfo"
                aria-describedby="electionsExtraInfo Dialog"
            >
                <DialogTitle id="electionsExtraInfo-title">
                    <ConstructComponentTitle title="Election" />
                </DialogTitle>
                <DialogContent dividers={true}>
                    <Container maxWidth="sm">
                        {electionsExtraInfo[electionID] ? (
                            <Grid
                                container
                                direction="column"
                                justifyContent="center"
                                alignItems="center"
                            >
                                <ConstructComponentTitle title="Information" />
                                <Grid item xs={12}>
                                    <TableContainer component={Paper}>
                                        <Table>
                                            {Object.keys(electionData).map(
                                                (identifier) => {
                                                    return (
                                                        <TableRow>
                                                            <TableCell variant="head">
                                                                {humanReadableIdentifier(
                                                                    identifier
                                                                ) || identifier}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    electionData[
                                                                        identifier
                                                                    ]
                                                                }
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                            )}
                                        </Table>
                                    </TableContainer>
                                </Grid>
                                <ConstructComponentTitle title="Ballots" />
                                <Grid item xs={12}>
                                    {Object.keys(ballotData).length === 0 && (
                                        <b>No Ballots</b>
                                    )}
                                    <List
                                        className={classes.list}
                                        subheader={<li />}
                                    >
                                        <li
                                            key={`section-ballots`}
                                            className={classes.listSection}
                                        >
                                            <ul className={classes.ul}>
                                                {Object.keys(ballotData).map(
                                                    (organization) => (
                                                        <div>
                                                            <ListSubheader
                                                                className={
                                                                    classes.subheader
                                                                }
                                                            >
                                                                {organization.toUpperCase()}
                                                            </ListSubheader>
                                                            <Grid
                                                                container
                                                                spacing={0}
                                                                direction="row"
                                                                alignItems="center"
                                                                justifyContent="center"
                                                                style={{
                                                                    backgroundColor:
                                                                        "#f2f2f2",
                                                                    minHeight:
                                                                        "10vh",
                                                                }}
                                                            >
                                                                <Grid
                                                                    item
                                                                    xs={12}
                                                                >
                                                                    <Grid
                                                                        container
                                                                        direction="row"
                                                                        xs={12}
                                                                    >
                                                                        <Grid
                                                                            item
                                                                            xs={
                                                                                6
                                                                            }
                                                                        >
                                                                            <Grid
                                                                                item
                                                                                xs={
                                                                                    12
                                                                                }
                                                                                align="center"
                                                                            >
                                                                                <strong>
                                                                                    SIGNED
                                                                                </strong>
                                                                            </Grid>
                                                                            <Divider />
                                                                            <Grid
                                                                                item
                                                                                xs={
                                                                                    12
                                                                                }
                                                                                align="center"
                                                                            >
                                                                                {valueToReadable(
                                                                                    ballotData[
                                                                                        organization
                                                                                    ]
                                                                                        .signed,
                                                                                    true
                                                                                )}
                                                                            </Grid>
                                                                        </Grid>
                                                                        <Grid
                                                                            item
                                                                            xs={
                                                                                6
                                                                            }
                                                                        >
                                                                            <Grid
                                                                                item
                                                                                xs={
                                                                                    12
                                                                                }
                                                                                align="center"
                                                                            >
                                                                                <strong>
                                                                                    APPROVAL
                                                                                </strong>
                                                                            </Grid>
                                                                            <Divider />
                                                                            <Grid
                                                                                item
                                                                                xs={
                                                                                    12
                                                                                }
                                                                                align="center"
                                                                            >
                                                                                {valueToReadable(
                                                                                    ballotData[
                                                                                        organization
                                                                                    ]
                                                                                        .approved,
                                                                                    false,
                                                                                    true
                                                                                )}
                                                                            </Grid>
                                                                        </Grid>
                                                                        <Grid
                                                                            item
                                                                            xs={
                                                                                12
                                                                            }
                                                                        >
                                                                            <Grid
                                                                                item
                                                                                xs={
                                                                                    12
                                                                                }
                                                                                align="center"
                                                                            >
                                                                                <strong>
                                                                                    VOTED
                                                                                    AT
                                                                                </strong>
                                                                            </Grid>
                                                                            <Divider />
                                                                            <Grid
                                                                                item
                                                                                xs={
                                                                                    12
                                                                                }
                                                                                align="center"
                                                                            >
                                                                                {valueToReadable(
                                                                                    ballotData[
                                                                                        organization
                                                                                    ]
                                                                                        .timeOfVote,
                                                                                    false
                                                                                )}
                                                                            </Grid>
                                                                        </Grid>
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                        </div>
                                                    )
                                                )}
                                            </ul>
                                        </li>
                                    </List>
                                </Grid>
                            </Grid>
                        ) : (
                            LoadingOverlay()
                        )}
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
