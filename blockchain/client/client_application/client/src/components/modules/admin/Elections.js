import React from "react";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Refresh from "@material-ui/icons/Refresh";
import CompletedElections from "../../../containers/admin/elections/submodules/CompletedElections";
import PendingElections from "../../../containers/admin/elections/submodules/PendingElections";
import ExpiredElections from "../../../containers/admin/elections/submodules/ExpiredElections";
import { GridDivider } from "../../../utils/processors/common/componentHelper";

function Elections({
    electionsExist,
    syncWithBCStakeholderElectionsRequest,
    isRefreshingElections,
}) {
    React.useState(async () => {
        if (!electionsExist) await syncWithBCStakeholderElectionsRequest();
    }, [electionsExist]);

    return (
        <Grid container spacing={1}>
            <Grid container item xs={12} justify="flex-end">
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Refresh />}
                    onClick={() => syncWithBCStakeholderElectionsRequest()}
                    style={{ textTransform: "none", color: "white" }}
                    disabled={isRefreshingElections}
                >
                    {!isRefreshingElections
                        ? "Refresh Elections"
                        : "Refreshing..."}
                </Button>
            </Grid>
            <GridDivider />
            <Grid item xs={12}>
                <PendingElections />
            </Grid>
            <GridDivider />
            <Grid item xs={12}>
                <CompletedElections />
            </Grid>
            <GridDivider />
            <Grid item xs={12}>
                <ExpiredElections />
            </Grid>
        </Grid>
    );
}

export default Elections;
