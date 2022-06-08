const router = require("express").Router();

const actionManager = require("../../middlewares/actionManager");
const backendCommunicator = require("../../middlewares/backendCommunicator");
const identityMiddleware = require("../../middlewares/identityManager");
const userMiddlerware = require("../../middlewares/user");

router.use("/auth", require("./auth"));
router.use(
    "/admin",
    userMiddlerware.jwtAuthenticator,
    identityMiddleware.identityManager,
    userMiddlerware.backendTokenExtractor,
    actionManager.defineAction,
    backendCommunicator.acquireTicket,
    backendCommunicator.constructServiceHeaders,
    require("./admin_actions")
);
router.use(
    "/auditor",
    userMiddlerware.jwtAuthenticator,
    identityMiddleware.identityManager,
    userMiddlerware.backendTokenExtractor,
    actionManager.defineAction,
    backendCommunicator.acquireTicket,
    backendCommunicator.constructServiceHeaders,
    require("./auditor_actions")
);
router.use(
    "/user",
    userMiddlerware.jwtAuthenticator,
    identityMiddleware.identityManager,
    userMiddlerware.checkIfGIDExists,
    userMiddlerware.backendTokenExtractor,
    actionManager.defineAction,
    backendCommunicator.acquireTicket,
    backendCommunicator.constructServiceHeaders,
    require("./user_actions")
);

router.use(function (err, req, res, next) {
    if (err.name === "ValidationError") {
        return res.status(422).json({
            errors: Object.keys(err.errors).reduce(function (errors, key) {
                errors[key] = err.errors[key].message;
                return errors;
            }, {}),
        });
    }
    return next(err);
});

module.exports = router;
