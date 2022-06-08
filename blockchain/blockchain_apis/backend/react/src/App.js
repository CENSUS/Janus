import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Toolbar from "@mui/material/Toolbar";

import Benchmarks from "./components/benchmarks/benchmarksPage";
import Main from "./components/main";
import { getBenchmarksAvailability } from "./apis/benchmarks";

const theme = createTheme();

function Logo() {
  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      justifyContent="center"
    >
      <Typography variant="h3" component="h2">
        Ministry of Health
      </Typography>
    </Grid>
  );
}

function Menu({ benchmarksOn }) {
  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
    >
      <Toolbar sx={{ flexWrap: "wrap" }}>
        <nav>
          <Link
            variant="button"
            color="text.primary"
            href="/"
            sx={{ my: 1, mx: 1.5 }}
          >
            Download Area
          </Link>
          {benchmarksOn && (
            <Link
              variant="button"
              color="text.primary"
              href="/benchmarks"
              sx={{ my: 1, mx: 1.5 }}
            >
              Benchmarks
            </Link>
          )}
        </nav>
      </Toolbar>
    </AppBar>
  );
}

function Footer({ benchmarksOn }) {
  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      justifyContent="center"
    >
      <Grid item xs={6}>
        <Menu benchmarksOn={benchmarksOn} />
      </Grid>
      <Grid item xs={6}>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 5 }}
        >
          {"Copyright © "}
          <Link color="inherit" href="">
            Ministry of Health
          </Link>{" "}
          {new Date().getFullYear()}
          {"."}
        </Typography>
      </Grid>
    </Grid>
  );
}

export default class App extends React.Component {
  constructor() {
    super();
    this.state = { benchmarksAvailability: false };
  }

  componentDidMount() {
    getBenchmarksAvailability().then((res) =>
      this.setState({ benchmarksAvailability: res })
    );
  }

  render() {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "80vh",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Container component="main" maxWidth="lg">
            <Grid
              container
              direction="column"
              alignItems="center"
              justifyContent="center"
              // style={{ minHeight: "100vh" }}
            >
              <CssBaseline />
              <Grid item xs>
                <Logo />
              </Grid>
              <Divider
                variant="middle"
                sx={{ minWidth: "100vh", m: "2vh" }}
                style={{}}
              />
              <Grid item xs sx={{ minWidth: "100vh" }}>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Main />} />
                    <Route path="/benchmarks" element={<Benchmarks />} />
                  </Routes>
                </BrowserRouter>
              </Grid>
            </Grid>
          </Container>
        </Box>
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: "auto",
          }}
        >
          <Footer benchmarksOn={this.state.benchmarksAvailability} />
        </Box>
      </ThemeProvider>
    );
  }
}
