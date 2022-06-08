import React from "react";

export const HomePageConfig = {
  routes: [
    {
      path: "/",
      exact: true,
      component: React.lazy(() => import("../../containers/LandingPage/LandingPage"))
    }
  ]
};
