import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Box from "@material-ui/core/Box";
import { AppBar, Grid } from "@material-ui/core";
import SwipeableViews from "react-swipeable-views";
import { useTheme } from "@material-ui/core/styles";
import { tableConstruct } from "./utils";

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

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
        display: "flex",
        overflow: "auto",
        maxHeight: "600px",
        flexDirection: "row",
        marginBottom: theme.spacing(2),
        margin: "auto",
    },
    tabs: {
        borderRight: `1px solid ${theme.palette.divider}`,
    },
}));

export function HorizontalTabs({ data, dataIsTableBodyData = false }) {
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
                                {dataIsTableBodyData
                                    ? tableConstruct("Table", data[key])
                                    : data[key]}
                            </TabPanel>
                        ))}
                    </SwipeableViews>
                </Grid>
            </Grid>
        </Box>
    );
}

export function VerticalTabs({ data }) {
    const classes = useStyles();
    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <div className={classes.root}>
            <Grid container>
                <Grid item xs={2}>
                    <Tabs
                        orientation="vertical"
                        variant="scrollable"
                        value={value}
                        onChange={handleChange}
                        aria-label="vertical-tabs"
                        className={classes.tabs}
                    >
                        {Object.keys(data).map((key, index) => (
                            <Tab
                                label={data[key]["name"]}
                                {...a11yProps(index)}
                            />
                        ))}
                    </Tabs>
                </Grid>

                <Grid item xs={10}>
                    {Object.keys(data).map((key, index) => (
                        <TabPanel value={value} index={index}>
                            {data[key]["data"]}
                        </TabPanel>
                    ))}
                </Grid>
            </Grid>
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};
