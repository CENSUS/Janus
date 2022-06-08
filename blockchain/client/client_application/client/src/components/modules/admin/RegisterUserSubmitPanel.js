import React from "react";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import { GridOverlay, DataGrid } from "@material-ui/data-grid";
import LinearProgress from "@material-ui/core/LinearProgress";
import Add from "@material-ui/icons/Add";
import Delete from "@material-ui/icons/Delete";
import { ConstructComponentTitle } from "../../../utils/processors/common/componentHelper";
import Divider from "@material-ui/core/Divider";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import DeleteSweepIcon from "@material-ui/icons/DeleteSweep";

const columns = [
    {
        field: "enrollmentID",
        sortable: false,
        width: 150,
        headerAlign: "center",
        align: "center",
        renderHeader: () => <strong>Enrollment ID</strong>,
    },
    {
        field: "enrollmentSecret",
        sortable: false,
        width: 170,
        headerAlign: "center",
        align: "center",
        renderHeader: () => <strong>Enrollment Secret</strong>,
        // renderCell: ({ value }) => {
        //     return removeUnderscoreFromString(value.toUpperCase());
        // },
    },
    {
        field: "GID",
        sortable: false,
        width: 150,
        headerAlign: "center",
        align: "center",
        renderHeader: () => <strong>GID</strong>,
        renderCell: ({ row: { attrs } }) => {
            const GID =
                Object.values(attrs)
                    .filter((attr) => attr.name === "GID")
                    .map((attr) => attr.value) || {};
            return GID[0] || "-";
        },
    },
    {
        field: "role",
        headerName: "Role",
        width: 100,
        headerAlign: "center",
        align: "center",
        renderHeader: () => <strong>Role</strong>,
        renderCell: ({ row: { role } }) => {
            return <strong>{role.toUpperCase()}</strong>;
        },
    },
    {
        field: "attributes",
        headerName: "Attributes",
        width: 150,
        headerAlign: "center",
        align: "center",
        sortable: false,
        renderCell: ({ row: { attrs } }) => {
            return Object.values(attrs)
                .filter((attr) => attr.name !== "GID")
                .map((attr) => attr.value)
                .join(",");
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

function UserSubmit({
    usersToRegisterRegistry,
    lastRegisteredUsers,
    registerUserRequest,
    removeUserFromUserRegistryRequest,
    clearSuccessfulRegsRequest,
    isRegisteringUsers,
}) {
    const [selectedRows, setSelectedRows] = React.useState([]);
    const [identitiesData, setIdentitiesData] = React.useState(
        usersToRegisterRegistry
    );

    const [successfulRegs, setSuccessfulRegs] =
        React.useState(lastRegisteredUsers); // Successful Registrations

    React.useEffect(() => {
        if (usersToRegisterRegistry !== identitiesData)
            setIdentitiesData(usersToRegisterRegistry);

        if (successfulRegs !== lastRegisteredUsers)
            setSuccessfulRegs(lastRegisteredUsers);
    }, [
        successfulRegs, // May create bugs
        identitiesData,
        usersToRegisterRegistry,
        lastRegisteredUsers,
    ]);

    const handleSelectionRows = (selection) => {
        setSelectedRows(selection);
    };

    const handlePurge = () => {
        removeUserFromUserRegistryRequest(selectedRows);
    };

    const handleRegister = () => {
        setSelectedRows([]);
        registerUserRequest(identitiesData);
    };

    const handleClearSuccessfulRegs = () => clearSuccessfulRegsRequest();

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <ConstructComponentTitle title="Identities' Queue" />
                <div style={{ height: 400, width: "100%" }}>
                    <div style={{ display: "flex", height: "100%" }}>
                        <div style={{ flexGrow: 1 }}>
                            <DataGrid
                                components={{
                                    LoadingOverlay: LoadingOverlay,
                                }}
                                density="compact"
                                loading={isRegisteringUsers}
                                Add
                                rows={identitiesData}
                                columns={columns}
                                pageSize={5}
                                getRowId={(row) => row.enrollmentID}
                                checkboxSelection
                                onSelectionModelChange={handleSelectionRows}
                            />
                        </div>
                    </div>
                </div>
            </Grid>
            <Grid container item xs={12} justify="flex-end">
                <ButtonGroup
                    disableElevation
                    variant="contained"
                    color="primary"
                >
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={() => handleRegister()}
                        style={{ textTransform: "none" }}
                    >
                        {isRegisteringUsers
                            ? "Registering..."
                            : "Register Users"}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Delete />}
                        onClick={() => handlePurge()}
                        style={{ textTransform: "none" }}
                        disabled={selectedRows.length === 0}
                    >
                        Remove
                    </Button>
                </ButtonGroup>
            </Grid>
            <Grid item xs={12}>
                <Divider />
            </Grid>
            <Grid item xs={12}>
                <ConstructComponentTitle title="Successful Enrollments" />
                <div style={{ height: 400, width: "100%" }}>
                    <div style={{ display: "flex", height: "100%" }}>
                        <div style={{ flexGrow: 1 }}>
                            <DataGrid
                                components={{
                                    LoadingOverlay: LoadingOverlay,
                                }}
                                density="compact"
                                loading={isRegisteringUsers}
                                rows={successfulRegs}
                                columns={columns}
                                pageSize={5}
                                getRowId={(row) => row.enrollmentID}
                            />
                        </div>
                    </div>
                </div>
            </Grid>
            <Grid container item xs={12} justify="flex-end">
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DeleteSweepIcon />}
                    onClick={() => handleClearSuccessfulRegs()}
                    style={{ textTransform: "none" }}
                    disabled={successfulRegs.length === 0}
                >
                    Clear
                </Button>
            </Grid>
        </Grid>
    );
}

export default UserSubmit;
