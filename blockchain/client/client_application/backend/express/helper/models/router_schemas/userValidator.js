const {
    errorValidator
} = require('./errorValidator');
const organizations = require('../../config/organizations');
const data_ids = require('../../config/acceptable_data_ids');

const {
    check
} = require('express-validator');

exports.loginValidator = [
    check('username')
    .notEmpty().withMessage('A username is required')
    .isString()
    .bail(),
    check('password')
    .notEmpty().withMessage('A password is required')
    .isString()
    .bail(),
    check('organization')
    .notEmpty().withMessage('An organization is required') // This should not (!) be mandatory
    .isString()
    .isUppercase().withMessage('The organization input must be in uppercase')
    .isIn(organizations.map(function (x) {
        return x.toUpperCase();
    })).withMessage('Unknown organization')
    .bail(),

    errorValidator
];

exports.identityValidatorJSON = [
    check('identity')
    .isObject().withMessage('Wrong identity information').bail()
    .notEmpty().withMessage(`Provide the identity's credentials`),

    check('identity.credentials.*')
    .isString().bail()
    .notEmpty().withMessage(`A value is required`),

    check('identity.mspId')
    .isString().bail()
    .notEmpty().withMessage(`A value is required`),

    check('identity.type')
    .isString().bail()
    .notEmpty().withMessage(`A value is required`),

    errorValidator
]

exports.validateExtraUserCreds = [
    check('extraUserCreds')
    .isArray()
    .optional()

    // Should also check every certificate (?)
]

exports.validateDataIDRequest = [
    check('data')
    .isObject().withMessage(`Data should be a JSON object`).bail()
    .notEmpty().withMessage(`Data can't be empty`)
    .custom((value, {req}) => {
        const data_id = Object.keys(value)[0].toLowerCase();
        const isKnownID = data_ids.includes(data_id)
        if (!isKnownID) {
            return false;
        }
        return true
    }),

    check('data.*.parameters.*')
    .notEmpty().withMessage('Provide a parameter'),

    check('data.*.organization')
    .optional()
    .isString().withMessage(`Provide the organization's name`),

    errorValidator
]


exports.validateReqID = [
    check('reqid').trim()
    .notEmpty().withMessage(`Provide a request ID`)
    .isAlphanumeric().withMessage(`The request ID must be a string of alphanumeric characters`),

    errorValidator
]

exports.isAcceptableIdentityObject = [

]
