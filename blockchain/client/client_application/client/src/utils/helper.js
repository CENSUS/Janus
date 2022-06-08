import { Grid, Divider as MaterialDivider } from "@material-ui/core";

export function CustomDivider({ children, ...props }) {
  return (
    <Grid container alignItems="center" spacing={1} {...props}>
      <Grid item xs>
        <MaterialDivider />
      </Grid>
      <Grid item>{children}</Grid>
      <Grid item xs>
        <MaterialDivider />
      </Grid>
    </Grid>
  );
}
