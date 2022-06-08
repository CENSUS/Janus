import { LinearProgress } from "@material-ui/core";
import { GridOverlay } from "@material-ui/data-grid";

export function LoadingOverlay() {
  return (
    <GridOverlay>
      <div style={{ position: "absolute", bottom: 0, width: "100%" }}>
        <LinearProgress />
      </div>
    </GridOverlay>
  );
}
