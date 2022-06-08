const router = require("express").Router();
const {
    identityManagement,
} = require("../../helper/data_processors/api_processor/login_processor");
const jwt = require("jsonwebtoken");
const {
    loginValidator,
} = require("../../helper/models/router_schemas/userValidator");
const { promiseHandler } = require("../../helper/data_processors/processor");
const {
    UnauthorizedRequest,
    GeneralError,
} = require("../../helper/data_processors/error_processor");
const tokenProcessor = require("../../helper/data_processors/api_processor/tokenProcessor");
const { acquireToken } = require("../../utilities/backend_authorizer");

router.post("/login", loginValidator, async function (req, res, next) {
    const { username, password, organization } = req.body;

    const [newIdentity, newIdentityError] = await promiseHandler(
        identityManagement(username, password, organization)
    );

    if (newIdentityError) {
        next(newIdentityError);
        return;
    }

    const { isAdmin, isCAAdmin, isAuditor, GID, identity } = newIdentity;

    const identityData = {
        username: username,
        organization: organization,
    };

    if (GID) identityData["GID"] = GID; // If the identity has a GID attribute, add it to the JWT
    if (isAdmin) identityData["isAdmin"] = isAdmin; // If the identity is an Admin, add it to the JWT
    if (isCAAdmin) identityData["isCAAdmin"] = isCAAdmin; // If the identity has a CA-ADMIN attribute, add it to the JWT
    if (isAuditor) identityData["isAuditor"] = isAuditor; // If the identity is an Auditor, add it to the JWT

    const baseToken = jwt.sign(identityData, "someverysecretkey", {
        expiresIn: "3000m",
    });

    const refreshToken = jwt.sign(identityData, "someverysecretkeyrefresh");

    const tokenData = { baseToken, refreshToken };

    tokenProcessor.storeRefreshToken(tokenData);

    // Acquire Server token
    const [backendToken, backendTokenErr] = await promiseHandler(
        acquireToken(identity)
    );

    if (backendTokenErr) {
        throw new GeneralError(backendTokenErr);
    }

    res.json({
        token: baseToken,
        refreshToken: refreshToken,
        identity,
        backendToken,
    });
});

router.delete("/logout", async function (req, res, next) {
    const { token } = req.body;

    tokenProcessor.removeRefreshToken(token);

    res.sendStatus(200);
});

router.post("/refresh-token", async function (req, res, next) {
    const { refreshToken } = req.body;

    try {
        // Should be used in production!
        // if (!refreshToken || !tokenProcessor.validateRefreshToken(refreshToken))
        //     throw new UnauthorizedRequest("A valid token was not provided");

        jwt.verify(refreshToken, "someverysecretkeyrefresh", (err, data) => {
            // Should use an .env variable
            if (err)
                throw new UnauthorizedRequest(
                    "Error while refreshing the token"
                );

            const identityData = {
                username: data.username,
                organization: data.organization,
            };

            data.GID && (identityData["GID"] = data.GID); // If the identity has a GID attribute, add it to the JWT
            data.isAdmin && (identityData["isAdmin"] = data.isAdmin); // If the identity is an Admin, add it to the JWT
            data.isCAAdmin && (identityData["isCAAdmin"] = data.isCAAdmin); // If the identity is an Admin, add it to the JWT
            data.isAuditor && (identityData["isAuditor"] = data.isAuditor); // If the identity is an Auditor, add it to the JWT

            const baseToken = jwt.sign(identityData, "someverysecretkey", {
                // Should use an .env variable
                expiresIn: "3000m",
            });

            const tokenData = { baseToken, refreshToken };

            tokenProcessor.updateRefreshToken(tokenData);

            res.json({
                token: baseToken,
            });
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
