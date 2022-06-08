import * as yup from "yup";

const loginValidationForm = {
    username: yup.string().required("A username is required"),

    password: yup
        .string()
        .min(3, "Password must contain at least 3 characters")
        .required("A password is required"),

    organization: yup.string().required("Select your organization"),
};

const vaultLoginValidationForm = {
    username: yup.string().required("A username is required"),

    password: yup
        .string()
        .min(3, "Password must contain at least 3 characters")
        .required("A password is required"),
};

const registerValidationForm = {
    username: yup.string().required("A username is required"),

    password: yup
        .string("Make a selection")
        .min(3, "Password must contain at least 3 characters")
        .required("A password is required"),

    type: yup.string().required("A type is required (Admin/Client)"),

    // attributeType: yup.string().when("type", {
    //   is: (val) => val === "admin",
    //   then: yup
    //     .string("Make a selection")
    //     .oneOf(["none"], "Attributes cannot be assigned to an Admin"),
    // }),

    attrs: yup
        .array()
        .when(["attributeType", "type"], {
            is: (attributeType, type) => {
                return attributeType === "role" && type !== "admin";
            },
            then: yup.array().min(1, "An attribute role is required"),
        })
        .when("type", {
            is: (val) => val === "client",
            then: yup
                .array()
                .test(
                    "arrayDoesNotInclude",
                    "A Client cannot own this attribute",
                    (array) => {
                        return !array.includes("CA-Admin");
                    }
                ),
        })
        // .when("type", {
        //   is: (val) => val === "admin",
        //   then: yup
        //     .array()
        //     .test(
        //       "arrayDoesNotInclude",
        //       "An Admin cannot own this attribute",
        //       (array) => {
        //         return !array.includes(["Doctor", "Technician", "Auditor"]);
        //       }
        //     ),
        // })
        .when("attributeType", {
            is: (val) => val === "none",
            then: yup.array().max(0, "An attribute role cannot be assigned"),
        })
        .max(1, "A Client cannot own more than one (1) attributes"),
    GID: yup
        .string()
        .when("attrs", {
            is: (attrs) => attrs.includes("Auditor"),
            then: yup.string().max(0, "An Auditor cannot have a GID"),
        })
        .when("type", {
            is: (type) => type === "admin",
            then: yup.string().max(0, "An Admin cannot have a GID"),
        }),
};

const votingValidationForm = {
    electionID: yup
        .string()
        .min(10, "Invalid Voting ID - Enter a valid Voting ID")
        .required("A Voting ID is required"),

    approval: yup
        .string()
        .required("A selection is required")
        .oneOf(["true", "false"], "A selection is required"),
};

const requestLogsInitValidationForm = {
    type: yup
        .string()
        .required("A selection is required")
        .oneOf(["UPDATE_LOG", "REQUEST_LOG"], "Unavailable type"),

    domain: yup
        .string()
        .required("A selection is required")
        .oneOf(["PROXY", "MEDICAL", "MANUFACTURER"], "Unavailable domain"),
};

const requestLogsValidationForm = {
    requestID: yup
        .string()
        .min(10, "Invalid Request ID - Enter a valid Request ID"),
};

const syncWithBCForm = {
    requestID: yup
        .string()
        .optional()
        .min(10, "Invalid Request ID (Min. 10 chars)"),
};


export {
    loginValidationForm,
    vaultLoginValidationForm,
    registerValidationForm,
    votingValidationForm,
    requestLogsInitValidationForm,
    requestLogsValidationForm,
    syncWithBCForm,
};
