const router = require("express").Router();
const { verifySignature } = require("./../../utils/crypto/crypto.js");
const network_manager = require("../../management/managers_dependencies/network_manager.js");
const ClientJWT = require("./../../utils/static/objects/client_jwt.js");

router.post("/acquire-app-token", async function (req, res, next) {
  let { certificate, signature } = req.body;
  signature = Buffer.from(signature, "base64");

  const verifiedSignature = verifySignature(
    certificate,
    certificate,
    signature
  );

  if (!verifiedSignature) {
    res.sendStatus(403);
    return;
  }

  const { basicInfo, isValidated } = network_manager.validateUser(certificate); // User's Validation

  if (!isValidated) {
    res.sendStatus(403);
    return;
  }

  const clientJWT = new ClientJWT(
    basicInfo.issuerCN,
    basicInfo.issuerOrganization,
    basicInfo.subjectCN,
    basicInfo.subjectOU
  );

  const signedClientJWT = clientJWT.signJWT();

  res.status(200).send(signedClientJWT);
});

module.exports = router;
