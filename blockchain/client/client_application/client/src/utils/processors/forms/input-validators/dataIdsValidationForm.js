import * as yup from "yup";

const DATA_00ValidationForm = {
    uuid: yup.string().defined("A UUID must be provided").uuid("Invalid input"),
};

const DATA_01ValidationForm = {
    uuid: yup
        .string()
        .uuid("Invalid input")
        .test("oneOfRequired", "", function () {
            return this.parent.uuid || this.parent.serial;
        }),
    serial: yup
        .string()
        .min(3, "Wrong serial")
        .test("oneOfRequired", "", function () {
            return this.parent.uuid || this.parent.serial;
        }),
    organization: yup.string().required("A selection is Required"),
};

const DATA_02ValidationForm = {
    uuid: yup.string().uuid("Invalid input").required("A UUID is required"),

    organization: yup.string().required("A selection is Required"),
};

const DATA_03ValidationForm = {
    uuid: yup.string().uuid("Invalid input").required("A UUID is required"),
    clinic_uuid: yup
        .string()
        .uuid("Invalid input")
        .required("A Clinic UUID is required"),
};

const DATA_04ValidationForm = {
    model: yup.string().required("A Model is required"),
};

export {
    DATA_00ValidationForm,
    DATA_01ValidationForm,
    DATA_02ValidationForm,
    DATA_03ValidationForm,
    DATA_04ValidationForm,
};
