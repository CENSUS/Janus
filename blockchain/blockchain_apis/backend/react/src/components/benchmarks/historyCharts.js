import React, { useEffect } from "react";
import { getBenchmarksHistory } from "../../apis/benchmarks";
import Grid from "@mui/material/Grid";

import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";

import LinearProgress from "@mui/material/LinearProgress";

import Stack from "@mui/material/Stack";

import { useInterval } from "../../utils/utils";

// Charts
import MainChart from "./charts/chart";

export default function Benchmarks() {
  const [benchmarkHistory, setBenchMarkHistory] = React.useState(null);
  const [isPolling, setIsPolling] = React.useState(false);

  // Select Component
  const [chartType, setChartType] = React.useState("AVERAGE");
  const handleChange = (event) => {
    setChartType(event.target.value);
  };

  useEffect(() => {
    const doGetHistory = async () => {
      const response = await getBenchmarksHistory();
      setBenchMarkHistory(response);
    };

    doGetHistory();
  }, []);

  useInterval(() => {
    if (isPolling) return;
    setIsPolling(true);
    getBenchmarksHistory().then((resp) => {
      setBenchMarkHistory(resp);
      setIsPolling(false);
    });
  }, 3000);

  const isPollingModule = () => (
    <Typography sx={{ color: isPolling ? "#009879" : "#d0d0d0" }}>
      {isPolling ? "Refreshing" : "Up To Date"}
    </Typography>
  );

  if (benchmarkHistory) {
    if (benchmarkHistory.history.length > 0) {
      return (
        <Grid
          alignItems="center"
          justifyContent="center"
          sx={{ minHeight: "50vh" }}
        >
          <Grid item xs sx={{ textAlign: "center" }}>
            <FormControl>
              <InputLabel id="history-type-label">Type</InputLabel>
              <Select
                labelId="chart-select"
                id="chart-select-comp"
                value={chartType}
                label="Chart"
                onChange={handleChange}
              >
                {Object.keys(benchmarkHistory.history[0].benchmarkInfo).map(
                  (key) => (
                    <MenuItem value={key} key={key}>
                      {key}
                    </MenuItem>
                  )
                )}
                )
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs>
            <MainChart
              dataKey={"SAMPLES_NR"}
              chartType={chartType}
              data={benchmarkHistory.history}
            />
          </Grid>
          <Grid item xs sx={{ textAlign: "center" }}>
            <div>{isPollingModule()}</div>
          </Grid>
        </Grid>
      );
    } else {
      return (
        <Grid
          container
          spacing={0}
          direction="column"
          alignItems="center"
          justifyContent="center"
        >
          <Grid item xs>
            <Typography variant="h6" gutterBottom component="div">
              No History Data to display
            </Typography>
          </Grid>
          <Grid item xs>
            <div>{isPollingModule()}</div>
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
