import React from "react";
import { makeStyles, Paper } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";
import { constructResponse, constructTable } from "./utils/utils";
import LocalLibraryIcon from "@material-ui/icons/LocalLibrary";
import {
    decryptData,
    deriveDataID,
    fetchDecryptionKeysFromData,
} from "../../../../utils/processors/data_processors";

import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Box from "@material-ui/core/Box";
import { AppBar } from "@material-ui/core";
import SwipeableViews from "react-swipeable-views";
import { useTheme } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    buttonProgress: {
        color: theme.palette.primary.main,
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12,
    },
    tabs: {
        borderRight: `1px solid ${theme.palette.divider}`,
    },
}));

let organizations;
export default function DataTable({
    isLoadingData,
    isDecryptingData,
    data,
    user,
    decryptionKeys,
    fullDecryptWithVaultRequest,
    organizationsList,
}) {
    const classes = useStyles();
    organizations = organizationsList;

    const { dataID } = data;
    const { organization } = user;
    const data_id = deriveDataID(dataID);

    const [dataToVisualizeEncrypted, setDataToVisualizeEnc] = React.useState(
        []
    );
    const [dataToVisualizeDecrypted, setDataToVisualizeDec] = React.useState(
        []
    );
    const [decryptionKeysFromData, setDecryptionKeysFromData] = React.useState(
        {}
    );
    const [constructedTables, setConstructedTables] = React.useState([]);
    const [tableObjects, setTableObjects] = React.useState([]);
    const [shouldUpdateRows, setShouldUpdateRows] = React.useState(false);

    React.useEffect(() => {
        if (data && data !== null && Object.keys(data).length > 0) {
            const [dataToVisualizeEncrypted, decryptionKeysFromData] =
                fetchDecryptionKeysFromData(data, true);
            setDataToVisualizeEnc(dataToVisualizeEncrypted);
            setDecryptionKeysFromData(decryptionKeysFromData);
        } else {
            setDataToVisualizeEnc([]);
            setDataToVisualizeDec([]);
            setDecryptionKeysFromData({});
            setTableObjects([]);
        }
    }, [data]);

    React.useEffect(() => {
        if (decryptionKeys && decryptionKeys !== null) {
            setDataToVisualizeDec(
                decryptData(dataToVisualizeEncrypted, decryptionKeys)
            );
        }
    }, [dataToVisualizeEncrypted, decryptionKeys]);

    React.useEffect(() => {
        setConstructedTables(
            constructResponse(dataToVisualizeDecrypted, organizations)
        );
        setShouldUpdateRows(true);
    }, [dataToVisualizeDecrypted]);

    React.useEffect(() => {
        if (shouldUpdateRows) {
            setTableObjects(constructedTables);
            setShouldUpdateRows(false);
        }
    }, [constructedTables, shouldUpdateRows]);

    return (
        <Grid container>
            {tableObjects.length > 0 ? (
                <HorizontalTabs data={tableObjects} />
            ) : (
                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<LocalLibraryIcon />}
                        style={{ textTransform: "none" }}
                        disabled={
                            dataToVisualizeEncrypted.length === 0 ||
                            isLoadingData ||
                            isDecryptingData
                        }
                        onClick={() =>
                            fullDecryptWithVaultRequest({
                                data_id: data_id,
                                encryptionKeys: decryptionKeysFromData,
                                organization: organization,
                            })
                        }
                    >
                        {dataToVisualizeEncrypted.length === 0
                            ? "Empty Data "
                            : isDecryptingData
                            ? "Decrypting..."
                            : "Access Data"}
                    </Button>
                    {(isLoadingData || isDecryptingData) && (
                        <CircularProgress
                            size={24}
                            className={classes.buttonProgress}
                        />
                    )}
                </Grid>
            )}
        </Grid>
    );
}

// Helper Functions

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && (
                <Grid container>
                    <Grid item xs={12}>
                        {children}
                    </Grid>
                </Grid>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `tab-${index}`,
        "aria-controls": `tabpanel-${index}`,
    };
}

function HorizontalTabs({ data = {} }) {
    const theme = useTheme();
    const [value, setValue] = React.useState(0);
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const handleChangeIndex = (index) => {
        setValue(index);
    };

    return (
        <Box sx={{ bgcolor: "background.paper", width: "100%" }}>
            <Grid container>
                <Grid item xs={12}>
                    <AppBar position="static">
                        <Tabs
                            value={value}
                            onChange={handleChange}
                            indicatorColor="secondary"
                            textColor="inherit"
                            variant="scrollable"
                            scrollButtons="auto"
                            aria-label="horizontal-records-tabs"
                        >
                            {Object.keys(data).map((key, index) => (
                                <Tab
                                    label={`Record ${index}`}
                                    {...a11yProps(index)}
                                />
                            ))}
                        </Tabs>
                    </AppBar>
                </Grid>
                <Grid item xs={12}>
                    <SwipeableViews
                        axis={theme.direction === "rtl" ? "x-reverse" : "x"}
                        index={value}
                        onChangeIndex={handleChangeIndex}
                    >
                        {Object.keys(data).map((key, index) => (
                            <TabPanel
                                value={value}
                                index={index}
                                dir={theme.direction}
                            >
                                <Paper>
                                    {constructTable(
                                        Object.values(data[key]).map(
                                            (data) => data
                                        ),
                                        false,
                                        true
                                    )}
                                </Paper>
                            </TabPanel>
                        ))}
                    </SwipeableViews>
                </Grid>
            </Grid>
        </Box>
    );
}
