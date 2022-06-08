const jwt = require("jsonwebtoken");
const config = require("../../config/main_config");
const { UnauthorizedRequest } = require("../../middlewares/utils/error_types");
const ClientJWT = require("./../static/objects/client_jwt.js");

// JWT - Sign
exports.jwtSign = (data, expiresIn = "10000m") => {
  return jwt.sign(data, config.jwtPass, {
    expiresIn: expiresIn,
  });
};

// JWT - Authenticate
exports.jwtAuthenticator = (req, res, next) => {
  const authHeader = req.headers.authorization;

  try {
    if (authHeader) {
      const token = authHeader.split(" ")[1];

      jwt.verify(token, config.jwtPass, function (err, data) {
        if (err) throw new UnauthorizedRequest(err);

        const clientJWT = new ClientJWT(
          data["issuerCN"],
          data["issuerOrganization"],
          data["subjectCN"],
          data["subjectOU"]
        );

        res.locals["authenticated_identity"] = clientJWT.getJWTInfo;
      });

      next();
    } else {
      throw new UnauthorizedRequest("Provide a valid Token");
    }
  } catch (err) {
    next(err.message);
  }
};
