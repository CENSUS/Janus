import React from "react";
import Grid from "@mui/material/Grid";
import BenchmarksCurrent from "./benchmark";
import BenchmarksHistory from "./historyCharts";
import Divider from "@mui/material/Divider";

export default function Page() {
  return (
    <Grid
      container
      direction="row"
      alignItems="center"
      justifyContent="center"
      minHeight={"50vh"}
    >
      <Grid item xs>
        <BenchmarksCurrent />
      </Grid>
      <Divider orientation="vertical" flexItem />
      <Grid item xs>
        <BenchmarksHistory />
      </Grid>
    </Grid>
  );
}
