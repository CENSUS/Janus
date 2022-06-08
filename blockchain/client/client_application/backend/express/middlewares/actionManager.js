const functionTypes = require("../helper/config/function_type_selector");
const _ = require("lodash");
const { clearUrlFromAPINoise } = require("../helper/data_processors/processor");

const defineAction = function (req, res, next) {
    let { originalUrl } = req;

    // If it is a `GET` request, remove the query from the URL
    originalUrl = originalUrl.split("?")[0];

    const originalUrlNoNoise = clearUrlFromAPINoise(originalUrl);
    let [endpointPrefix, endpointSuffix] = [null, null];

    const urlParts = originalUrlNoNoise.split("/");

    if (originalUrlNoNoise.startsWith("/")) {
        [endpointPrefix, endpointSuffix] = [urlParts[1], urlParts[2]];
    } else {
        [endpointPrefix, endpointSuffix] = [urlParts[0], urlParts[1]];
    }

    const functionType = _.first(
        Object.values(functionTypes)
            .filter((key) => key["endpointPrefix"] === endpointPrefix)
            .map((key) =>
                _.first(
                    Object.values(key).filter(
                        (key) => key["endpoint"] === endpointSuffix
                    )
                )
            )
    );

    if (!functionType) {
        next();
    } else {
        res.locals.willAccessBC = true;
        res.locals.willCommit = functionType["shouldCommit"];

        next();
    }
};

module.exports = { defineAction: defineAction };
