class GeneralError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }

  getCode() {
    if (this instanceof BadRequest) {
      return 400;
    }
    if (this instanceof NotFound) {
      return 404;
    }
    if (this instanceof UnauthorizedRequest) {
      return 401;
    }
    if (this instanceof ForbiddenRequest) {
      return 403;
    }
    if (this instanceof BadGateway) {
      return 502;
    }
    return 500;
  }
}

class BadRequest extends GeneralError {}
class NotFound extends GeneralError {}
class ForbiddenRequest extends GeneralError {}
class UnauthorizedRequest extends GeneralError {}
class BadGateway extends GeneralError {}

function _throwError(error) {
  throw error;
}

module.exports = {
  GeneralError,
  BadRequest,
  NotFound,
  ForbiddenRequest,
  UnauthorizedRequest,
  BadGateway,
  _throwError,
};
