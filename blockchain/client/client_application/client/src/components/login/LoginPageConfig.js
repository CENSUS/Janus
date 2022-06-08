import React from "react";
import authRoles from "../../auth/roles";

export const LoginPageConfig = {
  auth: authRoles.guest,
  routes: [
    {
      path: "/login",
      exact: true,
      component: React.lazy(() =>
        import("./LoginPage")
      ),
    },
  ],
};
