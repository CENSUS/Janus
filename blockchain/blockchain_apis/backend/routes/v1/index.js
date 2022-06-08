const router = require("express").Router();

const { GeneralError } = require("../../middlewares/utils/error_types.js");
const CertificateAuthority = require("../../management/bootstrap_ca.js");
const { jwtAuthenticator } = require("../../utils/crypto/jwt.js");

router.use("/auth", require("./auth"));
router.use("/blockchain", jwtAuthenticator, require("./blockchain"));
router.use("/executables", require("./executables"));
router.use("/benchmarks", require("./benchmarks"));

router.post("/ca-connection-profiles", async function (req, res, next) {
  const { organization } = req.body;

  try {
    const {
      certificateAuthorityInfo: { exposedUrl: caUrl, caName, tlsCACerts },
      organizationMspId: orgMspId,
      isInitialized = false,
    } = CertificateAuthority.getInstance(organization.toLowerCase());

    if (!isInitialized)
      throw new GeneralError(
        `The Authentication Service of ${organization} is unavailable`
      );

    res.send({ caUrl, caName, tlsCACerts, orgMspId });
  } catch (err) {
    next(err);
    return;
  }
});

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
