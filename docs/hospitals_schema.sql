CREATE TABLE "organization" (
  "uuid" uuid PRIMARY KEY,
  "name" varchar,
  "logo_url" varchar
);

CREATE TABLE "clinic" (
  "uuid" uuid PRIMARY KEY,
  "name" varchar,
  "address" varchar
);

CREATE TABLE "patient" (
  "uuid" uuid PRIMARY KEY,
  "SSN" varchar UNIQUE,
  "firstname" varchar,
  "surname" varchar,
  "weight" int,
  "address" varchar,
  "date_of_birth" date
);

CREATE TABLE "group_patient" (
  "firstname" varchar,
  "surname" varchar,
  "weight" int,
  "address" varchar,
  "date_of_birth" date 
)

CREATE TABLE "doctor" (
  "guid" uuid PRIMARY KEY,
  "firstname" varchar,
  "surname" varchar,
  "specialty" varchar
);

CREATE TABLE "doctor_contract" (
  "uuid" uuid PRIMARY KEY,
  "doctor_guid" uuid,
  "start_date" date,
  "end_date" date,
  "role" varchar,
  "clinic_stationed_uuid" uuid
);

CREATE TABLE "er_duty" (
  "id" SERIAL PRIMARY KEY,
  "start_time" datetime,
  "end_time" datetime,
  "doctor_contract_uuid" uuid
);

CREATE TABLE "treatment" (
  "uuid" uuid PRIMARY KEY,
  "clinic_uuid" uuid,
  "patient_uuid" uuid,
  "start_date" date,
  "last_update_date" date,
  "end_date" date,
  "description" varchar,
  "status" varchar
);

CREATE TABLE "group_treatment" (
  "description" varchar,
)
CREATE TABLE "prescription" (
  "uuid" uuid PRIMARY KEY,
  "treatment_uuid" uuid,
  "doctor_contract_uuid" uuid,
  "entry_time" datetime,
  "prescription_path" varchar
);

CREATE TABLE "group_prescription" (
   "prescription_path" varchar
)

CREATE TABLE "diagnosis" (
  "uuid" uuid PRIMARY KEY,
  "treatment_uuid" uuid,
  "doctor_contract_uuid" uuid,
  "entry_time" datetime,
  "diagnosis_data" varchar,
  "disease_uuid" uuid
)

CREATE TABLE "group_diagnosis" (  
  
  "diagnosis_data" varchar
  )

CREATE TABLE "disease" (
  "uuid" uuid PRIMARY KEY,
  "name" varchar,
  "description" varchar,
  "symptoms" varchar
);

CREATE TABLE "diagnostic_test_data" (
  "uuid" uuid PRIMARY KEY,
  "diagnosis_uuid" uuid,
  "test_type" varchar,
  "entry_time" datetime,
  "test_data" varchar
);

CREATE TABLE "group_dtd" (
  "test_data" varchar
)

CREATE TABLE "technician" (
  "guid" uuid PRIMARY KEY,
  "firstname" varchar,
  "surname" varchar
);

CREATE TABLE "technician_contract" (
  "uuid" uuid PRIMARY KEY,
  "technician_guid" uuid,
  "start_date" date,
  "end_date" date
);

CREATE TABLE "medical_device" (
  "uuid" uuid PRIMARY KEY,
  "serial" varchar UNIQUE,
  "manufacturer" varchar,
  "model" varchar,
  "install_date" date,
  "last_maint_uuid" uuid,
  "next_required_maint" date,
  "clinic_uuid" uuid
);

CREATE TABLE "medical_device_maint" (
  "uuid" uuid PRIMARY KEY,
  "device_uuid" uuid,
  "description" varchar,
  "technician_contract_uuid" uuid,
  "start_time" datetime,
  "end_time" datetime
);

ALTER TABLE "doctor_contract" ADD FOREIGN KEY ("docto_guid") REFERENCES "doctor" ("guid");

ALTER TABLE "doctor_contract" ADD FOREIGN KEY ("clinic_stationed") REFERENCES "clinic" ("uuid");

ALTER TABLE "er_duty" ADD FOREIGN KEY ("doctor_contract_uuid") REFERENCES "doctor_contract" ("uuid");

ALTER TABLE "treatment" ADD FOREIGN KEY ("clinic_uuid") REFERENCES "clinic" ("uuid");

ALTER TABLE "treatment" ADD FOREIGN KEY ("patient_uuid") REFERENCES "patient" ("uuid");

ALTER TABLE "prescription" ADD FOREIGN KEY ("treatment_uuid") REFERENCES "treatment" ("uuid");

ALTER TABLE "prescription" ADD FOREIGN KEY ("doctor_contract_uuid") REFERENCES "doctor_contract" ("uuid");

ALTER TABLE "diagnosis" ADD FOREIGN KEY ("treatment_uuid") REFERENCES "treatment" ("uuid");

ALTER TABLE "diagnosis" ADD FOREIGN KEY ("doctor_contract_uuid") REFERENCES "doctor_contract" ("uuid");

ALTER TABLE "diagnosis" ADD FOREIGN KEY ("disease_uuid") REFERENCES "disease" ("uuid");

ALTER TABLE "diagnostic_test_data" ADD FOREIGN KEY ("diagnosis_uuid") REFERENCES "diagnosis" ("uuid");

ALTER TABLE "technician_contract" ADD FOREIGN KEY ("technician_guid") REFERENCES "technician" ("guid");

ALTER TABLE "medical_device" ADD FOREIGN KEY ("last_maint_uuid") REFERENCES "medical_device_maint" ("uuid");

ALTER TABLE "medical_device" ADD FOREIGN KEY ("clinic_uuid") REFERENCES "clinic" ("uuid");

ALTER TABLE "medical_device_maint" ADD FOREIGN KEY ("device_uuid") REFERENCES "medical_device" ("uuid");

ALTER TABLE "medical_device_maint" ADD FOREIGN KEY ("technician_contract_uuid") REFERENCES "technician_contract" ("uuid");
