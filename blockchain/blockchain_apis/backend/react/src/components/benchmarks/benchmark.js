import React, { useEffect } from "react";
import {
  getBenchmarkData,
  resetStats,
  getAvailableBenchmarks,
} from "../../apis/benchmarks";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import styled from "@emotion/styled";

import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";

import Stack from "@mui/material/Stack";
import Fade from "@mui/material/Fade";

import NumbersIcon from "@mui/icons-material/Numbers";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import ScheduleIcon from "@mui/icons-material/Schedule";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
import FunctionsIcon from "@mui/icons-material/Functions";

import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

import { useInterval } from "../../utils/utils";

const KNOWN_BENCHMARK_KEYS = {
  SAMPLES_NR: { name: "Requests Nr.", icon: <NumbersIcon />, type: "samples" },
  TICKETING: {
    name: "Ticket Time",
    icon: <ConfirmationNumberIcon />,
    type: "secs.",
  },
  ENDORSE: { name: "Endorse Time", icon: <ScheduleIcon />, type: "secs." },
  COMMIT: { name: "Commit Time", icon: <ScheduleIcon />, type: "secs." },
  BC_RTT: { name: "Blockchain RTT", icon: <RestartAltIcon />, type: "secs." },
  STD_DEV: { name: "STD Deviation", icon: <ScatterPlotIcon />, type: "" },
  MIN_VALUE: {
    name: "Minimun Time Value",
    icon: <KeyboardDoubleArrowDownIcon />,
    type: "secs.",
  },
  MAX_VALUE: {
    name: "Maximum Time Value",
    icon: <KeyboardDoubleArrowUpIcon />,
    type: "secs.",
  },
  AVERAGE: {
    name: "Average",
    icon: <FunctionsIcon />,
    type: "secs.",
    specialSxRow: {
      backgroundColor: "#ff8b3e !important",
    },
    specialSxCell: {
      color: "white !important",
      fontWeight: "medium",
    },
  },
};

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#009879",
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

export default function Benchmarks() {
  const [availableBenchmarks, setAvailableBenchmarks] = React.useState([]);
  const [benchmarkData, setBenchmarkData] = React.useState(null);
  const [isPollingBenchmarkData, setIsPollingBenchmarkData] =
    React.useState(false);
  const [isPollingAvailBenchmarks, setIsPollingAvailBenchmarks] =
    React.useState(false);

  // Reset Statistics
  const [isResetStats, setIsResetStats] = React.useState(false);
  const [showResetSuccess, setShowResetSuccess] = React.useState(false);

  // Select Component
  const [benchmarkSelection, setbenchmarkSelection] = React.useState("LIVE");
  const handleChange = (event) => {
    const getSelectedBenchmark = async (payload = null) => {
      const response = await getBenchmarkData(payload);
      setBenchmarkData(response);
    };

    const newValue = event.target.value;

    if (newValue !== benchmarkSelection) {
      getSelectedBenchmark(event.target.value);
      setbenchmarkSelection(event.target.value);
    }
  };

  useEffect(() => {
    const doGetAvailableBenchmarks = async () => {
      const response = await getAvailableBenchmarks();
      setAvailableBenchmarks(response);
    };
    const dogetBenchmarkData = async () => {
      const response = await getBenchmarkData();
      setBenchmarkData(response);
    };

    doGetAvailableBenchmarks();
    dogetBenchmarkData();
  }, []);

  useInterval(() => {
    if (!isPollingBenchmarkData) {
      if (benchmarkSelection === "LIVE") {
        setIsPollingBenchmarkData(true);
        getBenchmarkData().then((resp) => {
          setBenchmarkData(resp);
          setIsPollingBenchmarkData(false);
        });
      }
    }

    if (!isPollingAvailBenchmarks) {
      setIsPollingAvailBenchmarks(true);
      getAvailableBenchmarks().then((resp) => {
        setAvailableBenchmarks(resp);
        setIsPollingAvailBenchmarks(false);
      });
    }
  }, 3000);

  const isPollingModule = (condition) => (
    <Typography sx={{ color: condition ? "#009879" : "#d0d0d0" }}>
      {condition ? "Refreshing" : "Up To Date"}
    </Typography>
  );

  const BenchmarkSelectForm = () => (
    <FormControl>
      <InputLabel id="benchmark-select-label">Datetime</InputLabel>
      <Select
        labelId="benchmark-select"
        id="benchmark-select-comp"
        value={benchmarkSelection}
        label="Benchmark"
        onChange={handleChange}
        defaultChecked={"LIVE"}
      >
        <MenuItem value={"LIVE"} key={"LIVE"}>
          Live
        </MenuItem>
        {availableBenchmarks.map((value) => (
          <MenuItem value={value} key={value}>
            {new Date(value).toLocaleString()}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const ConstructTable = () => (
    <TableContainer component={Paper} sx={{ maxWidth: "70vh" }}>
      <Table aria-label="benchmarks-table-main">
        <TableHead>
          <StyledTableRow>
            <StyledTableCell colSpan={2} align={"center"}>
              <b>BENCHMARK</b>
            </StyledTableCell>
          </StyledTableRow>
        </TableHead>
        <TableBody>
          <StyledTableRow>
            <StyledTableCell align={"center"}>AGGREGATED</StyledTableCell>
            <StyledTableCell align={"center"}>
              {isPollingModule(isPollingBenchmarkData)}
            </StyledTableCell>
          </StyledTableRow>
          <TableRow>
            <TableCell colSpan={2}>
              <Grid container direction="column" alignItems="center">
                <Table
                  sx={{
                    maxWidth: "50vh",
                  }}
                  aria-label="benchmarks-table-report"
                >
                  <TableHead>
                    <StyledTableRow>
                      <StyledTableCell colSpan={3} align={"center"}>
                        Report
                      </StyledTableCell>
                    </StyledTableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(benchmarkData.benchmarkInfo).map(
                      ([key, value]) => {
                        const keyInfo = KNOWN_BENCHMARK_KEYS[key];
                        if (!keyInfo)
                          return (
                            <StyledTableRow key={key}>
                              <StyledTableCell colSpan={3}>
                                Unknown
                              </StyledTableCell>
                            </StyledTableRow>
                          );
                        return (
                          <StyledTableRow
                            sx={{
                              ...keyInfo.specialSxRow,
                            }}
                            key={key}
                          >
                            <StyledTableCell
                              sx={{
                                ...keyInfo.specialSxCell,
                              }}
                            >
                              {keyInfo.icon}
                            </StyledTableCell>
                            <StyledTableCell
                              sx={{
                                ...keyInfo.specialSxCell,
                              }}
                              align="center"
                            >
                              {keyInfo.name}
                            </StyledTableCell>
                            <StyledTableCell
                              sx={{
                                ...keyInfo.specialSxCell,
                              }}
                              align="center"
                            >
                              {`${value} ${keyInfo.type}`}
                            </StyledTableCell>
                          </StyledTableRow>
                        );
                      }
                    )}
                  </TableBody>
                </Table>
              </Grid>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const resetStatsFn = async () => {
    setIsResetStats(true);
    const response = await resetStats();
    setIsResetStats(false);
    if (response.message) {
      setBenchmarkData(null);
    } else {
      setShowResetSuccess(true);
      setTimeout(function () {
        setShowResetSuccess(false);
      }, 3000);
    }
  };

  if (benchmarkData) {
    if (benchmarkData.hasRequestsToDisplay) {
      return (
        <Grid
          container
          direction="column"
          alignItems="center"
          justifyContent="center"
        >
          <Grid item xs sx={{ textAlign: "center" }}>
            <Item>
              <BenchmarkSelectForm />
            </Item>
          </Grid>
          <Divider
            variant="horizontal"
            sx={{ minWidth: "1", my: 1 }}
            style={{ my: 50 }}
          />
          <Grid item xs>
            <ConstructTable />
          </Grid>
          <Grid item xs>
            <p>
              {!showResetSuccess ? (
                <Fade in={true}>
                  <Button
                    sx={{ color: isResetStats ? "#009879" : "inherit" }}
                    onClick={resetStatsFn}
                  >
                    {isResetStats ? "Please wait..." : "Reset Stats"}
                  </Button>
                </Fade>
              ) : (
                <Fade in={true}>
                  <Typography sx={{ color: "#f01d1d" }}>
                    You cannot reset the Statistics while there are active
                    Requests!
                  </Typography>
                </Fade>
              )}
            </p>
          </Grid>
        </Grid>
      );
    } else {
      return (
        <Grid
          container
          direction="column"
          alignItems="center"
          justifyContent="center"
          style={{ minHeight: "50vh" }}
        >
          <Grid
            container
            item
            xs
            direction="column"
            sx={{ textAlign: "center" }}
            style={{ maxWidth: "30vh" }}
          >
            <Item>
              <BenchmarkSelectForm />
            </Item>
          </Grid>
          <Divider
            variant="horizontal"
            sx={{ minWidth: "1", my: 1 }}
            style={{ my: 50 }}
          />
          <Grid
            container
            item
            xs
            direction="column"
            alignItems="center"
            justifyContent="center"
            alignContent="center"
          >
            <Typography variant="h6" gutterBottom component="div">
              No Data to display
            </Typography>
            <Typography variant="caption" display="block" gutterBottom>
              Create some requests in order for the System to display some data
            </Typography>
          </Grid>
          <Grid item xs>
            <div>{isPollingModule(isPollingBenchmarkData)}</div>
          </Grid>
        </Grid>
      );
    }
  } else {
    return (
      <Stack sx={{ color: "grey.500" }} spacing={2} direction="column">
        <LinearProgress color="success" />
        <br />
        <Typography>Please wait - Communicating with the Server...</Typography>
      </Stack>
    );
  }
}
