import React from "react";
import authRoles from "../../auth/roles";

export const AuditorHomePageConfig = {
    auth: authRoles.auditor,
    routes: [
        {
            path: "/auditor/audit",
            exact: true,
            name: "Blockchain Audit",
            icon: undefined,
            component: React.lazy(() => import("./BlockchainAudit")),
        },
    ],
};
