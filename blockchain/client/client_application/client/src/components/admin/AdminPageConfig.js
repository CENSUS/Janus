import React from "react";
import authRoles from "../../auth/roles";

export const AdminHomePageConfig = {
    auth: authRoles.admin,
    routes: [
        {
            path: "/admin/user-management",
            exact: true,
            name: "User Management",
            icon: undefined,
            component: React.lazy(() => import("./UsersManage")),
        },
    ],
};

export const CAAdminHomePageConfig = {
    auth: authRoles.caAdmin,
    routes: [
        {
            path: "/ca-admin/trust-anchors",
            exact: true,
            name: "Trust Anchors Management",
            icon: undefined,
            component: React.lazy(() => import("./TrustAnchors")),
        },
        {
            path: "/ca-admin/elections",
            exact: true,
            name: "Blockchain Elections",
            icon: undefined,
            component: React.lazy(() => import("./ElectionsPage")),
        },
    ],
};
