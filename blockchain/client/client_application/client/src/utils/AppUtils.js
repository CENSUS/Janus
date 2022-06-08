class AppUtils {
    static setRoutes(config) {
        let routes = [...config.routes];

        if (config.auth) {
            routes = routes.map((route) => {
                let auth = config.auth ? [...config.auth] : null;
                auth = route.auth ? [...auth, ...route.auth] : auth;
                return {
                    ...route,
                    auth,
                };
            });
        }

        return [...routes];
    }

    static generateRoutesFromConfigs(configs) {
        let allRoutes = [];
        configs.forEach((config) => {
            allRoutes = [...allRoutes, ...this.setRoutes(config)];
        });
        return allRoutes;
    }

    static hasPermission(authArr, userRole) {
        if (authArr === null || authArr === undefined) {
            return true;
        } else if (authArr.length === 0) {
            return !userRole || userRole.length === 0;
        } else {
            if (userRole && Array.isArray(userRole)) {
                return authArr.some((t) => userRole.indexOf(t) >= 0);
            }
            return authArr.includes(userRole);
        }
    }
}

export default AppUtils;
