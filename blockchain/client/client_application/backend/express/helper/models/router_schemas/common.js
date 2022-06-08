'use strict';
const { errorValidator } = require('./errorValidator');

const {
    check
} = require('express-validator');

exports.validatorBASE64 = [
    check('payload').trim()
    .notEmpty().withMessage('Provide a payload').bail()
    .isBase64().withMessage('Provide a payload in a base64 encoding').bail(),
    errorValidator
];