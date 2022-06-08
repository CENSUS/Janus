import React from "react";
import { Redirect } from "react-router-dom";
import {
    AdminHomePageConfig,
    CAAdminHomePageConfig,
} from "../components/admin/AdminPageConfig";
import { LoginPageConfig } from "../components/login/LoginPageConfig";
import { Error404PageConfig } from "../components/extras/errors/404/Error404PageConfig";
import { HomePageConfig } from "../components/landingPage/LandingPageConfig";
import { AuditorHomePageConfig } from "../components/auditor/AuditorPageConfig";
import { ClientHomePageConfig } from "../components/client/ClientPageConfig";

import AppUtils from "../utils/AppUtils";

const routeConfigs = [
    HomePageConfig,
    AdminHomePageConfig,
    CAAdminHomePageConfig,
    AuditorHomePageConfig,
    ClientHomePageConfig,
    LoginPageConfig,
    Error404PageConfig,
];

const routes = [
    ...AppUtils.generateRoutesFromConfigs(routeConfigs),
    {
        component: () => <Redirect to="/errors/error-404" />,
    },
];

export default routes;
