"use strict";
const jwt = require("jsonwebtoken");
const {
  UnauthorizedRequest,
} = require("../helper/data_processors/error_processor");

exports.jwtAuthenticator = (req, res, next) => {
  const authHeader = req.headers.authorization;

  try {
    if (authHeader) {
      const token = authHeader.split(" ")[1];

      // Should use an .env var
      jwt.verify(token, "someverysecretkey", function (err, data) {
        if (err) {
          throw new UnauthorizedRequest(err);
        }

        const { username, organization, GID, isAdmin } = data;
        const authenticated_identity = {
          username,
          organization,
          GID,
          isAdmin,
        };
        res.locals["authenticated_identity"] = authenticated_identity;
      });
      next();
    } else {
      throw new UnauthorizedRequest("Provide a valid Token");
    }
  } catch (err) {
    next(err);
  }
};

exports.checkIfGIDExists = (req, res, next) => {
  const { GID } = res.locals.authenticated_identity;
  if (!GID) {
    try {
      throw new UnauthorizedRequest(
        "A GID is required. Make sure that your Identity has a GID attribute."
      );
    } catch (err) {
      next(err);
    }
  }

  next();
};

exports.backendTokenExtractor = (req, res, next) => {
  const backendAuthHeader = req.headers.backendauthorization;

  if (backendAuthHeader)
    res.locals.backendAuthorizationToken = backendAuthHeader;

  next();
};
