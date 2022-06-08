import React, { useEffect } from "react";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { getClientExecutable } from "../apis/common";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const ProgressBar = (props) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography
          variant="body2"
          color="text.secondary"
        >{`${props.value}%`}</Typography>
      </Box>
    </Box>
  );
};

export default function Main() {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [progress, setProgress] = React.useState(null);

  const updateProgress = (currentProgress) => {
    setProgress(currentProgress);
  };

  useEffect(() => {
    if (progress) {
      setIsDownloading(true);
    } else {
      setIsDownloading(false);
    }
  }, [progress]);

  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      minWidth="100vh"
      maxWidth="100vh"
      // backgroundColor="#f7f7f7"
    >
      <Grid item xs>
        <Typography
          variant="h6"
          gutterBottom
          component="div"
          sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
        >
          JANUS CLIENT APPLICATION
        </Typography>
      </Grid>
      <Grid item xs>
        <Grid
          container
          direction="row"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          minWidth="50vh"
          maxWidth="50vh"
          // backgroundColor="#f7f7f7"
        >
          <Grid item xs={4}>
            <Button
              onClick={() =>
                getClientExecutable("linux", updateProgress.bind(this))
              }
              variant="contained"
              color="primary"
            >
              Linux
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button
              onClick={() =>
                getClientExecutable("windows", updateProgress.bind(this))
              }
              variant="contained"
              color="primary"
            >
              Windows
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button
              onClick={() =>
                getClientExecutable("mac", updateProgress.bind(this))
              }
              variant="contained"
              color="primary"
              disabled
            >
              MacOS
            </Button>
          </Grid>
        </Grid>
      </Grid>
      {isDownloading && (
        <Grid
          item
          xs
          sx={{
            my: 5,
            minWidth: "100vh",
            minHeight: "fit-content",
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <ProgressBar value={progress} />
        </Grid>
      )}
    </Grid>
  );
}
