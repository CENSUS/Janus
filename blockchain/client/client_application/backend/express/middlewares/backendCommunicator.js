const { acquireBlockchainTicket } = require("../apis/apiAccessor");
const {
  constructBackendHeaders,
  constructBackendBCPayload,
  combineBackendHeaders,
  constructBackendServiceHeaders,
} = require("../helper/data_processors/processor");

const acquireTicket = async function (req, res, next) {
  const willAccessBC = res.locals.willAccessBC;

  if (willAccessBC) {
    const willCommit = res.locals.willCommit;

    const headers = constructBackendHeaders(
      res.locals.backendAuthorizationToken
    );

    const payload = constructBackendBCPayload(willAccessBC, willCommit);

    const serviceJWT = await acquireBlockchainTicket(headers, payload);

    res.locals.serviceJWT = serviceJWT;
  }

  next();
};

const constructServiceHeaders = async function (req, res, next) {
  const backendHeaders = constructBackendHeaders(
    res.locals.backendAuthorizationToken
  );

  const serviceHeaders = constructBackendServiceHeaders(res.locals.serviceJWT);

  const combinedHeaders = combineBackendHeaders(backendHeaders, serviceHeaders);

  res.locals.serviceHeaders = combinedHeaders;

  next();
};

module.exports = {
  acquireTicket: acquireTicket,
  constructServiceHeaders: constructServiceHeaders,
};
