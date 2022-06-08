import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import AssignmentIcon from "@material-ui/icons/Assignment";
import { ConstructComponentTitle } from "../../../utils/processors/common/componentHelper";

const baseInfo = [
    { name: "Data Hash", value: "dataHash" },
    { name: "Time", value: "invocationTime" },
    { name: `Invoker's MSP`, value: "invokerMSP" },
    { name: "Invoker", value: "invoker" },
];
function UpdateLogsExtraInfo({ logsExtra }) {
    const [open, setOpen] = React.useState(false);

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
                aria-labelledby="updateLogsExtraInfo"
                aria-describedby="updateLogsExtraInfo Dialog"
            >
                <DialogTitle id="updateLogsExtraInfo-title">
                    <ConstructComponentTitle title="Update Logs' Inspection" />
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
                                            {logsExtra.data[item.value] ||
                                                "undefined"}
                                        </Grid>
                                    </>
                                );
                            })}
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

export default UpdateLogsExtraInfo;
