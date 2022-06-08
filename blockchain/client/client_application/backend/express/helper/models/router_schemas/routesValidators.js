"use strict";

const {
    validateDataIDRequest,
    validateExtraUserCreds,
} = require("./userValidator");

exports.requestAccessValidator = [
    validateExtraUserCreds,
    validateDataIDRequest,
];

exports.updateTrustAnchorsValidator = [];
