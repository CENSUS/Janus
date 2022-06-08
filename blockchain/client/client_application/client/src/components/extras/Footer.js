import React from "react";
import { withStyles, withWidth, AppBar, Toolbar, Container } from "@material-ui/core";

const styles = (theme) => ({
  appBar: {
    boxShadow: theme.shadows[6],
    background:
      "linear-gradient(90deg, rgba(24,78,119,1) 0%, rgba(30,96,145,1) 67%, rgba(26,117,159,1) 100%)",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
  },
});

function Footer(props) {
  const { classes } = props;
  return (
    <footer>
      <AppBar position="static">
        <Container maxWidth="md">
          <Toolbar className={classes.toolbar}>
            {/* <Typography variant="body1" color="inherit">
          </Typography> */}
          </Toolbar>
        </Container>
      </AppBar>
    </footer>
  );
}

export default withWidth()(withStyles(styles, { withTheme: true })(Footer));
