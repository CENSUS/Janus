import React from "react";
import { makeStyles } from "@material-ui/core";
import withStyles from "@material-ui/core/styles/withStyles";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Paper from "@material-ui/core/Paper";
import Box from "@material-ui/core/Box";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Button from "@material-ui/core/Button";
import Switch from "@material-ui/core/Switch";
import TableContainer from "@material-ui/core/TableContainer";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import DeleteIcon from "@material-ui/icons/Delete";
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser";
import RefreshIcon from "@material-ui/icons/Refresh";
import { ConstructComponentTitle } from "../../../../utils/processors/common/componentHelper";

const AntSwitch = withStyles((theme) => ({
    root: {
        width: 28,
        height: 16,
        padding: 0,
        display: "flex",
    },
    switchBase: {
        padding: 2,
        color: theme.palette.grey[500],
        "&$checked": {
            transform: "translateX(12px)",
            color: theme.palette.common.white,
            "& + $track": {
                opacity: 1,
                backgroundColor: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
            },
        },
    },
    thumb: {
        width: 12,
        height: 12,
        boxShadow: "none",
    },
    track: {
        border: `1px solid ${theme.palette.grey[500]}`,
        borderRadius: 16 / 2,
        opacity: 1,
        backgroundColor: theme.palette.common.white,
    },
    checked: {},
}))(Switch);

const useStyles = makeStyles((theme) => ({
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
    table: {
        width: "100%",
    },
    paper: {
        padding: theme.spacing(1),
        display: "flex",
        overflow: "auto",
        flexDirection: "column",
        marginBottom: theme.spacing(2),
        margin: "auto",
    },
}));

function CombinedIdentitiesPanel({
    combinedIdentities,
    organizationsList,
    getCombinedIdentitiesRequest,
    deleteCombinedIdentityRequest,
    toggleCombinedIdentityRequest,
    userValidationRequest,
}) {
    const classes = useStyles();
    const [combinedIdentitiesList, updateCombinedIdentitiesList] =
        React.useState(combinedIdentities);

    React.useEffect(() => {
        if (!combinedIdentities) {
            getCombinedIdentitiesRequest();
        } else {
            updateCombinedIdentitiesList(combinedIdentities);
        }
    }, [combinedIdentities, getCombinedIdentitiesRequest]);

    return (
        <Grid container>
            <Paper className={classes.paper}>
                <Grid item xs={12}>
                    <ConstructComponentTitle title="Combined Identities" />
                    {Object.keys(organizationsList).map((domain) => (
                        <Box
                            overflow="auto"
                            display="flex"
                            flexDirection="column"
                            alignItems="stretch"
                            padding={1}
                        >
                            <Typography
                                component="h5"
                                variant="h6"
                                color="primary"
                                gutterBottom
                            >
                                {domain.toUpperCase()}
                            </Typography>

                            {organizationsList[domain].map((organization) => (
                                <Accordion
                                    disabled={
                                        combinedIdentitiesList &&
                                        !combinedIdentitiesList[
                                            organization.name
                                        ]
                                    }
                                    square={true}
                                    expanded={
                                        combinedIdentitiesList &&
                                        combinedIdentitiesList[
                                            organization.name
                                        ]
                                            ? combinedIdentitiesList[
                                                  organization.name
                                              ].length > 0
                                            : false
                                    }
                                >
                                    <AccordionSummary
                                        aria-controls={`panel-content-${organization.name}`}
                                        id={`panel-header-${organization.name}`}
                                    >
                                        <Typography className={classes.heading}>
                                            {organization.name.replaceAll(
                                                "-",
                                                " "
                                            )}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Box
                                            overflow="auto"
                                            display="flex"
                                            flexDirection="column"
                                            padding={1}
                                        >
                                            <TableContainer component={Paper}>
                                                <Table
                                                    className={classes.table}
                                                    size="small"
                                                >
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell align="left">
                                                                Identity
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                Combined
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                Remove
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    {combinedIdentitiesList &&
                                                        combinedIdentitiesList[
                                                            organization.name
                                                        ] &&
                                                        Object.values(
                                                            combinedIdentitiesList[
                                                                organization
                                                                    .name
                                                            ]
                                                        ).map((user) => (
                                                            <TableRow
                                                                key={
                                                                    user.username
                                                                }
                                                            >
                                                                <TableCell
                                                                    align="left"
                                                                    component="th"
                                                                    scope="row"
                                                                    width="25%"
                                                                >
                                                                    {
                                                                        user.username
                                                                    }
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <AntSwitch
                                                                        checked={
                                                                            user.isActive
                                                                        }
                                                                        onChange={() =>
                                                                            toggleCombinedIdentityRequest(
                                                                                {
                                                                                    organization:
                                                                                        organization.name,
                                                                                    username:
                                                                                        user.username,
                                                                                }
                                                                            )
                                                                        }
                                                                        name="toggleIdentity"
                                                                    />
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <Button
                                                                        color="primary"
                                                                        style={{
                                                                            textTransform:
                                                                                "none",
                                                                        }}
                                                                        onClick={() =>
                                                                            deleteCombinedIdentityRequest(
                                                                                {
                                                                                    username:
                                                                                        user.username,
                                                                                    organization:
                                                                                        organization.name,
                                                                                }
                                                                            )
                                                                        }
                                                                    >
                                                                        <DeleteIcon />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box>
                    ))}
                </Grid>
                <Grid item xs={12}>
                    <ButtonGroup>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<RefreshIcon />}
                            style={{ textTransform: "none" }}
                            onClick={() => getCombinedIdentitiesRequest()}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<VerifiedUserIcon />}
                            style={{ textTransform: "none" }}
                            onClick={() => userValidationRequest()}
                        >
                            Validate
                        </Button>
                    </ButtonGroup>
                </Grid>
            </Paper>
        </Grid>
    );
}

export default CombinedIdentitiesPanel;
