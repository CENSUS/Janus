const router = require("express").Router();
const {
  derivePKFromIdentity,
} = require("../../helper/data_processors/client_processor");
const {
  buildCAAuthenticatorObject,
  promiseHandler,
} = require("../../helper/data_processors/processor");
const {
  updateTrustAnchorsValidator,
} = require("../../helper/models/router_schemas/routesValidators");
const CertificateAuthority = require("../../utilities/bootstrap_ca");
const functionTypes = require("../../helper/config/function_type_selector");
const { signData } = require("../../helper/data_processors/crypto");
const { doCommit, doEvaluate } = require("../../utilities/proposal_actions");

router.post("/register-user", async function (req, res, next) {
  const { organization } = res.locals.authenticated_identity;
  const identity = res.locals.identity;
  const {
    newUserIdentities = [], // [{"enrollmentID": "enrollmentID", "enrollmentSecret": "enrollmentSecret", "attrs": [{"name": "GID", "value": "12345", "ecert": true},{"name": "ROLE_DOCTOR", "value": "DOCTOR", "ecert": true }]}]
  } = req.body;

  const adminUser = await buildCAAuthenticatorObject(identity);
  const caInstance = await CertificateAuthority.getInstance(organization);

  const caClient = caInstance.getCAClient();

  let successfulEnrollments = [];

  for (const newUserDetails of newUserIdentities) {
    const { enrollmentID, enrollmentSecret, role, attrs, maxEnrollments } =
      newUserDetails;

    for (const attribute of attrs) {
      if (!attribute["ecert"] || attribute["ecert"] === false)
        attribute["ecert"] = true; //Make sure that ecert is true and that it exists - if not, then fix it or add it
    }

    try {
      const enrollmentDetails = {
        enrollmentID: enrollmentID,
        enrollmentSecret: enrollmentSecret,
        role: role ? role : "client", // the default role is of type 'client'
        attrs: attrs, // attributes = [{name:'foo', value:'bar', ecert: true}];
        maxEnrollments: maxEnrollments ? maxEnrollments : -1,
      };
      const secret = await caClient.register(enrollmentDetails, adminUser);

      enrollmentDetails.secret = secret;

      successfulEnrollments = [...successfulEnrollments, enrollmentDetails];
    } catch (err) {
      continue;
    }
  }

  res.send({
    successfulEnrollments: successfulEnrollments,
  });
});

// Invokes the `updateTrustAnchors` function that is implemented at the TMSC
router.post(
  "/updatetrustanchors",
  updateTrustAnchorsValidator,
  async function (req, res, next) {
    const functionParams = functionTypes.admin.updateTrustAnchors;
    const identity = res.locals.identity;

    const { data } = req.body;

    const bufData = Buffer.from(data).toString("base64");

    const constructedArguments = [bufData];

    const serviceHeaders = res.locals.serviceHeaders;

    const [response, responseErr] = await promiseHandler(
      doCommit(identity, functionParams, constructedArguments, serviceHeaders)
    );

    !responseErr ? res.send(response) : next(responseErr);
  }
);

// Invokes the `majorityConsentUpdate` function that is implemented at the PSC
router.post("/vote", async function (req, res, next) {
  const functionParams = functionTypes.admin.majorityClientVote;
  const identity = res.locals.identity;

  const {
    authoritySign, // { nonce: nonce, approved: bool }
  } = req.body;

  const identityPrivKey = derivePKFromIdentity(identity);
  const { challengeData } = authoritySign;
  const signature = signData(challengeData, identityPrivKey);

  authoritySign.signature = signature;
  delete authoritySign.challengeData;

  const constructedArguments = [authoritySign];

  const serviceHeaders = res.locals.serviceHeaders;

  const [response, responseErr] = await promiseHandler(
    doCommit(identity, functionParams, constructedArguments, serviceHeaders)
  );

  !responseErr ? res.send(response) : next(responseErr);
});

// Invokes the `addCA` function that is implemented at the TMSC
router.post("/addca", async function (req, res, next) {
  const functionParams = functionTypes.admin.addCA;
  const identity = res.locals.identity;

  const {
    newCAData, // [ orgMSP, caCert, caCRL, tempACL ]
  } = req.body;

  let bufferedNewCAData = [];

  bufferedNewCAData.push(newCAData[0]);
  for (let i = 1; i <= 3; i++) {
    bufferedNewCAData.push(Buffer.from(newCAData[i]).toString("base64"));
  }

  const constructedArguments = [...bufferedNewCAData];

  const serviceHeaders = res.locals.serviceHeaders;

  const [response, responseErr] = await promiseHandler(
    doCommit(identity, functionParams, constructedArguments, serviceHeaders)
  );

  !responseErr ? res.send(response) : next(responseErr);
});

// Invokes the `removeCA` function that is implemented at the TMSC
router.post("/removeca", async function (req, res, next) {
  const functionParams = functionTypes.admin.removeCA;
  const identity = res.locals.identity;

  const { caName } = req.body;

  const constructedArguments = [caName];

  const serviceHeaders = res.locals.serviceHeaders;

  const [response, responseErr] = await promiseHandler(
    doCommit(identity, functionParams, constructedArguments, serviceHeaders)
  );

  !responseErr ? res.send(response) : next(responseErr);
});

// Invokes the `syncEntityWithBC` (`activeElectionsOfStakeholder`) function that is implemented at the PSC
router.get("/sync-stakeholder-elections", async function (req, res, next) {
  const functionParams =
    functionTypes.admin.syncEntityWithBC_SYNC_STAKEHOLDER_ELECTIONS;
  const identity = res.locals.identity;

  const constructedArguments = [{ type: "activeElectionsOfStakeholder" }];

  const serviceHeaders = res.locals.serviceHeaders;

  const [response, responseErr] = await promiseHandler(
    doEvaluate(identity, functionParams, constructedArguments, serviceHeaders)
  );

  !responseErr ? res.send(response) : next(responseErr);
});

// Invokes the `syncEntityWithBC` (`electionInspect`) function that is implemented at the PSC
router.get("/sync-election-extra-data", async function (req, res, next) {
  const functionParams =
    functionTypes.admin.syncEntityWithBC_SYNC_ELECTIONS_EXTRA_DATA;
  const identity = res.locals.identity;

  const electionID = req.query["electionID"] || req.body["electionID"];

  const constructedArguments = [
    { type: "electionInspect", parameters: { electionID } },
  ];

  const serviceHeaders = res.locals.serviceHeaders;

  const [response, responseErr] = await promiseHandler(
    doEvaluate(identity, functionParams, constructedArguments, serviceHeaders)
  );

  !responseErr ? res.send(response) : next(responseErr);
});

module.exports = router;
