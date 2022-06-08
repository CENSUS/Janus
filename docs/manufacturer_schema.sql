CREATE TABLE "manufacturer" (
  "uuid" uuid PRIMARY KEY,
  "name" varchar
);

CREATE TABLE "firmware" (
  "uuid" uuid PRIMARY KEY,
  "version" int,
  "sha1_hash" char(40),
  "path" varchar,
);

CREATE TABLE "device_model" (
  "uuid" uuid PRIMARY KEY,
  "name" varchar,
  "device_type" varchar,
  "shipped_firmware_uuid" uuid,
  "latest_firmware_available_uuid" uuid,
);

CREATE TABLE "manufactured_device" (
  "uuid" uuid PRIMARY KEY,
  "serial" varchar UNIQUE,
  "device_model_uuid" uuid,
  "current_firmware_uuid" uuid,
);

CREATE TABLE "manufacturing_technician" (
  "guid" uuid PRIMARY KEY,
  "firstname" varchar,
  "surname" varchar
);

CREATE TABLE "technician_manufacturing_contract" (
  "uuid" uuid PRIMARY KEY,
  "technician_guid" uuid,
  "start_date" date,
  "end_date" date
);

CREATE TABLE "personnel" (
  "guid" uuid PRIMARY KEY,
  "firstname" varchar,
  "surname" varchar,
);


CREATE TABLE "personnel_contract" (
  "guid" uuid PRIMARY KEY,
  "personnel_uuid" uuid,
  "start_date" date,
  "end_date" date,
);


CREATE TABLE "incident" (
  group_key 
  "id" SERIAL PRIMARY KEY,
  "device_serial" varchar,
  "time" datetime,
  "description" varchar,
  "report_path" varchar,
);

CREATE TABLE "group_incident" (
  "description" varchar,
  "report_path" varchar,
)

ALTER TABLE "firmware" ADD FOREIGN KEY ("manufacturer_uuid") REFERENCES "manufacturer" ("uuid");

ALTER TABLE "device_model" ADD FOREIGN KEY ("shipped_firmware_uuid") REFERENCES "firmware" ("uuid");

ALTER TABLE "device_model" ADD FOREIGN KEY ("latest_firmware_available") REFERENCES "firmware" ("uuid");

ALTER TABLE "manufactured_device" ADD FOREIGN KEY ("device_model_uuid") REFERENCES "device_model" ("uuid");

ALTER TABLE "manufactured_device" ADD FOREIGN KEY ("current_firmware_uuid") REFERENCES "firmware" ("uuid");

ALTER TABLE "incidents" ADD FOREIGN KEY ("device_SN") REFERENCES "manufactured_device" ("SN");

