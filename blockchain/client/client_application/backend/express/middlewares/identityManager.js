const { jsonParser } = require("../helper/data_processors/processor");

const identityManager = function (req, res, next) {
    const { identity } = req.headers;
    res.locals.identity = jsonParser(identity);
    next();
};

module.exports = { identityManager: identityManager };
