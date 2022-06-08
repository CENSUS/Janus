const AVAILABLE_OBJECTS = Object.freeze({
    accessOptions: {
        accessGranted: false,
        type: null,
        onDutyUntil: null,
    },
    requestDetails: {
        data_type: null,
        data_value: null,
        organization: null,
    },
});

module.exports = {
    ACCESS_OPTIONS: AVAILABLE_OBJECTS.accessOptions,
    REQUEST_DETAILS: AVAILABLE_OBJECTS.requestDetails,
};
