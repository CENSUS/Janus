import { createMuiTheme, responsiveFontSizes } from "@material-ui/core";

// colors
const primary = "#003152";
const secondary = "#e6e6e6";
const darkBlue = "#082640";
const darkCyan = "#00496c";
const softGray = "#f4f4f4";
const darkGray = "#8c8c8c";
const darkRed = "#ab0000";
const black = "#343a40";
const darkBlack = "rgb(36, 40, 44)";
const background = "#fff";
const backgroundLinear =
    "radial-gradient(circle, rgba(69,100,255,0.5620448863139005) 0%, rgba(0,41,209,0.36316533449317223) 100%)";
const warningLight = "rgba(253, 200, 69, .3)";
const warningMain = "rgba(253, 200, 69, .5)";
const warningDark = "rgba(253, 200, 69, .7)";
const white = "#fff";
// border
const borderWidth = 2;
const borderColor = "rgba(0, 0, 0, 0.13)";
const paper = "#fff";

// breakpoints
const xl = 1920;
const lg = 1280;
const md = 960;
const sm = 600;
const xs = 0;

// spacing
const spacing = 6;

const theme = createMuiTheme({
    palette: {
        primary: { main: primary },
        secondary: { main: secondary },
        common: {
            black,
            darkBlack,
            white,
            darkBlue,
            softGray,
            darkCyan,
            darkGray,
            darkRed,
        },
        warning: {
            light: warningLight,
            main: warningMain,
            dark: warningDark,
        },
        // Used to shift a color's luminance by approximately
        // two indexes within its tonal palette.
        // E.g., shift from Red 500 to Red 300 or Red 700.
        tonalOffset: 0.2,
        background: {
            default: background,
            linearBlue: backgroundLinear,
            paper,
        },
        spacing,
    },
    breakpoints: {
        // Define custom breakpoint values.
        // These will apply to Material-UI components that use responsive
        // breakpoints, such as `Grid` and `Hidden`. You can also use the
        // theme breakpoint functions `up`, `down`, and `between` to create
        // media queries for these breakpoints
        values: {
            xl,
            lg,
            md,
            sm,
            xs,
        },
    },
    border: {
        borderColor: borderColor,
        borderWidth: borderWidth,
    },
    overrides: {
        MuiCssBaseline: {
            // Scrollbars
            "@global": {
                "*::-webkit-scrollbar": {
                    width: "7px",
                    height: "7px",
                },
                "*::-webkit-scrollbar-track": {
                    background: "inherit",
                    boxShadow: "inset 0 0 4px rgba(0, 0, 0, 0.3)",
                },
                "*::-webkit-scrollbar-thumb": {
                    backgroundColor: "#505050",
                    borderRadius: "5px",
                    border: "#505050",
                },
                "*::-webkit-scrollbar-corner": {
                    background: "inherit",
                },
            },
        },
        // MUI-Datatables
        MUIDataTableBodyCell: {
            root: {
                backgroundColor: white,
                color: "rgb(21, 21, 21)",
                borderBottom: "none",
                textAlign: "center",
            },
        },
        MUIDataTableHeadCell: {
            root: {
                justifyContent: "center",
                textAlign: "center",
            },
            contentWrapper: {
                alignItems: "center",
                justifyContent: "center",
            },
        },
        MUIDataTableHead: {
            root: {
                backgroundColor: "#e7e7e7",
                color: "rgb(21, 21, 21)",
                borderBottom: "none",
            },
        },
        MUIDataTableToolbar: {
            root: {
                backgroundColor: "#f4f4f4",
                color: black,
            },
            left: {
                flex: "none",
            },
        },
        MUIDataTablePagination: {
            root: {
                backgroundColor: "#1D252D",
                color: "rgb(255, 255, 255)",
            },
        },
        MUIDataTableDivider: {
            root: {
                backgroundColor: "#1D252D",
                color: "rgb(255, 255, 255)",
            },
        },
        // MUI-Datatables
        MuiExpansionPanel: {
            root: {
                position: "static",
            },
        },
        MuiTablePagination: {
            root: {
                color: "#bdbdbd",
            },
            toolbar: {
                backgroundColor: white,
            },
        },
        MuiTableCell: {
            root: {
                paddingLeft: spacing * 2,
                paddingRight: spacing * 2,
                borderBottom: `${borderWidth}px solid ${borderColor}`,
                [`@media (max-width:  ${sm}px)`]: {
                    paddingLeft: spacing,
                    paddingRight: spacing,
                },
            },
        },
        MuiDivider: {
            root: {
                backgroundColor: borderColor,
                height: borderWidth,
            },
        },
        MuiPrivateNotchedOutline: {
            root: {
                borderWidth: borderWidth,
            },
        },
        MuiListItem: {
            divider: {
                borderBottom: `${borderWidth}px solid ${borderColor}`,
            },
        },
        MuiDialog: {
            paper: {
                width: "100%",
                maxWidth: 430,
                marginLeft: spacing,
                marginRight: spacing,
            },
        },
        MuiTooltip: {
            tooltip: {
                backgroundColor: darkBlack,
            },
        },
        MuiExpansionPanelDetails: {
            root: {
                [`@media (max-width:  ${sm}px)`]: {
                    paddingLeft: spacing,
                    paddingRight: spacing,
                },
            },
        },
    },
    typography: {
        useNextVariants: true,
    },
    mixins: {
        toolbar: {
            minHeight: 48,
            backgroundColor: "black",
        },
    },
});

export default responsiveFontSizes(theme);
