const router = require("express").Router();
const { promiseHandler } = require("../../helper/data_processors/processor");
const functionTypes = require("../../helper/config/function_type_selector");
const { doCommit, doEvaluate } = require("../../utilities/proposal_actions");

router.post("/retrieveloginit", async function (req, res, next) {
    const functionParams = functionTypes.auditor.retrieveLogInit;
    const identity = res.locals.identity;

    const { domain, type } = req.body;

    const constructedArguments = [{ domain, type }];

    const serviceHeaders = res.locals.serviceHeaders;

    const [response, responseErr] = await promiseHandler(
        doCommit(identity, functionParams, constructedArguments, serviceHeaders)
    );

    !responseErr ? res.send(response) : next(responseErr);
});

router.post("/retrievelogs", async function (req, res, next) {
    const functionParams = functionTypes.auditor.retrieveLogs;
    const identity = res.locals.identity;

    const { requestData } = req.body;

    const constructedArguments = [requestData];

    const serviceHeaders = res.locals.serviceHeaders;

    const [response, responseErr] = await promiseHandler(
        doEvaluate(
            identity,
            functionParams,
            constructedArguments,
            serviceHeaders
        )
    );

    !responseErr ? res.send(response) : next(responseErr);
});

router.post("/sync-audits", async function (req, res, next) {
    const functionParams = functionTypes.auditor.syncAudits;
    const identity = res.locals.identity;

    const { requestID } = req.body;

    const constructedArguments = [{ parameter: requestID }];

    const serviceHeaders = res.locals.serviceHeaders;

    const [response, responseErr] = await promiseHandler(
        doEvaluate(
            identity,
            functionParams,
            constructedArguments,
            serviceHeaders
        )
    );

    !responseErr ? res.send(response) : next(responseErr);
});

module.exports = router;
