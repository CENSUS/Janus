import React from "react";
import authRoles from "../../auth/roles";

export const ClientHomePageConfig = {
    auth: authRoles.client,
    routes: [
        {
            path: "/client/dashboard",
            exact: true,
            name: "Dashboard",
            icon: undefined,
            component: React.lazy(() => import("./Dashboard")),
        },
        {
            path: "/client/attributes",
            exact: true,
            name: "My Attributes",
            icon: undefined,
            component: React.lazy(() => import("./Attributes")),
        },
        {
            path: "/client/configuration",
            exact: true,
            name: "Configuration",
            icon: undefined,
            component: React.lazy(() => import("./Config")),
        },
    ],
};
