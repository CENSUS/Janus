import React from "react";

export const Error404PageConfig = {
  routes: [
    {
      path: "/errors/error-404",
      exact: true,
      component: React.lazy(() => import("./Error404Page"))
    }
  ]
};
