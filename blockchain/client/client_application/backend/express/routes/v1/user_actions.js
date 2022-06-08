const router = require("express").Router();
const {
  constructSignedIdentities,
} = require("../../helper/data_processors/client_processor");
const {
  promiseHandler,
  recoverActiveIdentities,
} = require("../../helper/data_processors/processor");
const {
  requestAccessValidator,
} = require("../../helper/models/router_schemas/routesValidators");
const {
  extraIdentityManagement,
} = require("../../helper/data_processors/api_processor/login_processor");
const functionTypes = require("../../helper/config/function_type_selector");
const { doEvaluate, doCommit } = require("../../utilities/proposal_actions");
const IdentitiesManager = require("../../utilities/identities_manager");

router.get("/combined-identities", async function (req, res, next) {
  const { GID: authenticatedGID } = res.locals.authenticated_identity;

  let combinedIdentitiesList = {};
  const identities = IdentitiesManager.getIdentities(authenticatedGID);

  Object.keys(identities).forEach(function (organization) {
    Object.keys(identities[organization]).forEach(function (user) {
      combinedIdentitiesList = {
        ...combinedIdentitiesList,
        [organization]: [
          ...(combinedIdentitiesList[organization] || []),
          {
            username: user,
            isActive: identities[organization][user].isActive,
          },
        ],
      };
    });
  });

  res.json(combinedIdentitiesList);
});

router.post("/toggle-identity", async function (req, res, next) {
  const { GID: authenticatedGID } = res.locals.authenticated_identity;
  const { username, organization } = req.body;

  let updatedToggleValue;
  try {
    updatedToggleValue = IdentitiesManager.toggleIdentity(
      authenticatedGID,
      organization,
      username
    );
  } catch (err) {
    next(err);
    return;
  }

  res.status(200).json({
    message: "Successful toggle",
    username: username,
    isActive: updatedToggleValue,
    organization: organization,
  });
});

router.post("/combine-identities", async function (req, res, next) {
  const { GID: authenticatedGID } = res.locals.authenticated_identity;
  const { username, password, organization } = req.body;

  const [newIdentity, newIdentityError] = await promiseHandler(
    extraIdentityManagement(username, password, organization, authenticatedGID)
  );
  if (newIdentityError) return next(newIdentityError);

  const {
    GID: newIdentityGID,
    certificate: identityCert,
    privateKey: identityPrivKey,
  } = newIdentity;

  const combinedIdentity = {
    certificate: identityCert,
    privateKey: identityPrivKey,
  };

  const appendedIdentity = IdentitiesManager.addIdentity(
    newIdentityGID,
    username,
    organization,
    combinedIdentity
  );

  res.status(200).json({
    message: "Successful combination",
    username: username,
    isActive: appendedIdentity.isActive,
    organization: organization,
  });
});

router.delete("/delete-combined", async function (req, res, next) {
  const { GID: authenticatedGID } = res.locals.authenticated_identity;
  const { username, organization } = req.body;

  IdentitiesManager.removeIdentity(authenticatedGID, organization, username);

  res.status(200).json({
    message: `Successfully remove ${username} [Organization: ${organization}] from your combined identities`,
    username: username,
    organization: organization,
  });
});

// Invokes the `requestAccess` function that is implemented at the PSC
router.post(
  "/requestaccess",
  requestAccessValidator,
  async function (req, res, next) {
    const identity = res.locals.identity;
    const functionParams = functionTypes.client.requestAccess;

    const { GID } = res.locals.authenticated_identity;
    const {
      data, // eg. { "data": { "data_00": { "parameters": { "uuid": "0cba7673-5157-43b0-baf9-110774431020"}}}}
    } = req.body;

    const activeCombinedIdentities = recoverActiveIdentities(
      IdentitiesManager.getIdentities(GID) || []
    );

    const usedIdentities = constructSignedIdentities(
      identity,
      activeCombinedIdentities
    );

    const constructedArguments = [usedIdentities, data];

    const serviceHeaders = res.locals.serviceHeaders;

    const [response, responseErr] = await promiseHandler(
      doCommit(identity, functionParams, constructedArguments, serviceHeaders)
    );

    !responseErr ? res.send(response) : next(responseErr);
  }
);

// Invokes the `syncEntityWithBC` function that is implemented at the PSC
router.post("/sync", async function (req, res, next) {
  const functionParams = functionTypes.client.syncEntityWithBC;

  const identity = res.locals.identity;

  const { reqID, bookmark = "" } = req.body;

  const constructedArguments = [
    { type: "userRequest", parameter: reqID || null, bookmark },
  ];

  const serviceHeaders = res.locals.serviceHeaders;

  const [response, responseErr] = await promiseHandler(
    doEvaluate(identity, functionParams, constructedArguments, serviceHeaders)
  );

  !responseErr ? res.send(response) : next(responseErr);
});

// Invokes the `getDataFromBC` function that is implemented at the PSC
router.post("/getdata", async function (req, res, next) {
  const functionParams = functionTypes.client.getDataFromBC;

  const identity = res.locals.identity;

  const { reqID } = req.body;

  const constructedArguments = [{ requestID: reqID }];

  const serviceHeaders = res.locals.serviceHeaders;

  const [response, responseErr] = await promiseHandler(
    doEvaluate(identity, functionParams, constructedArguments, serviceHeaders)
  );

  !responseErr ? res.send(response) : next(responseErr);
});

// Invokes the `validateUser` function that is implemented at the PSC
router.get("/user-validation", async function (req, res, next) {
  const functionParams = functionTypes.client.validateUser;
  const identity = res.locals.identity;
  const { GID } = res.locals.authenticated_identity;

  const activeCombinedIdentities = recoverActiveIdentities(
    IdentitiesManager.getIdentities(GID) || []
  );

  const usedIdentities = constructSignedIdentities(
    identity,
    activeCombinedIdentities
  );

  const constructedArguments = [usedIdentities];

  const serviceHeaders = res.locals.serviceHeaders;

  const [response, responseErr] = await promiseHandler(
    doEvaluate(identity, functionParams, constructedArguments, serviceHeaders)
  );

  !responseErr ? res.send(response) : next(responseErr);
});

module.exports = router;
