# Request Flow

The proxy blockchain will post a request on the domain_api with input format specified in the next section.

Upon receiving the request, the domain_api will decode the JWT and check for it's validity.
If it is valid, the `verified_attributes` and `data_id` fields will be passed on the 
*Access Control Smart Contract* which will return `true/false` depending on 
if the request meets the policy criteria.

If access is granted, depending on the `data_id` and `data`, the appropriate request is made to db_api.
The result of the request is passed onto the *Keystore Smart Contract* for handling 
(logging + partial decryption.).

Once *Keystore Smart Contract* is done with handling the response data,
they are sent back to proxy blockchain.

# Input


A JWT request is described in [domain_jwt.md]


# Output

All output will also be encoded in a JWT. 
Here we present the decoded-unencrypted values.

## Get Patient History (`data_00`)

### Request to db_api

**Command**

`POST`@/clinic-api-v0/patient/full

**Payload** One of the following JSON.
```json
{
    "uuid": "d39d3d4f-1c39-48dc-82a3-a89ddb5d2f72"
}
```

```json
{
    "SSN": "SSN_00"
}
```

```json
{
    "firstname": "anna",
    "surname": "leighton",
    "date_of_birth": "1984-05-04"
}
```
### Reply from db_api

```json
{
    "uuid": "d39d3d4f-1c39-48dc-82a3-a89ddb5d2f72",
    "SSN": "SSN_00",
    "firstname": "anna",
    "surname": "leighton",
    "weight": "52",
    "address": "address_00",
    "date_of_birth": "1984-05-04",
    "treatments": [
        {
            "uuid": "6844f5e0-56af-4760-a919-561373486aeb",
            "patient_uuid": "d39d3d4f-1c39-48dc-82a3-a89ddb5d2f72",
            "start_date": "2020-03-04",
            "last_update_date": "2020-03-14",
            "description": "treatment of patient_00 in clinic_0",
            "status": "status_00",
            "clinic_uuid": "4181f798-3579-4b94-908e-71aac9dde0d0"
        }

    ],
    "prescriptions": [
        {
            "uuid": "29950d30-8533-49bb-9cb5-a51daf824f25",
            "treatment_uuid": "6844f5e0-56af-4760-a919-561373486aeb",
            "doctor_contract_uuid": "d527065f-55b1-4cc8-b516-270dc77e5bfc",
            "entry_time": "2020-03-04 12:33",
            "prescription_path": "/tmp/prescription_00.txt"
        }
    ],
    "diagnoses": [
        {
            "uuid":  "e70b0dbc-46fe-40bf-a76a-708e0faf2ce9",
            "treatment_uuid": "6844f5e0-56af-4760-a919-561373486aeb",
            "doctor_contract_uuid": "d527065f-55b1-4cc8-b516-270dc77e5bfc",
            "entry_time": "2020-03-05 12:23",
            "diagnosis_data": "diagnosis for treatment_00 in clinic_0",
            "disease_uuid": "fbdc32fd-47ae-467f-ad61-29144de20402"
        }
    ],
    "organization_uuid": "dffc7f9a8-51c4-714a-8caf-0ebfee1e434"
}
```

## Check Firmware (`data_01`)

### Request to db_api

**Command**

`POST`@/manufacturer-api-v0/device/is_firmware_up_to_date

**Payload** One of the following JSON
```json
{
      "uuid": "d187fa6a-8afa-4f10-b113-741841abb875"
}
```

```json
{
      "serial": "serial_10"
}
```

### Reply from db_api

```json
true
```

or

```json
false
```

## Get fault statistics (`data_02`)

### Request to db_api

**Command**

`POST`@/manufacturer-api-v0/incident/stats/model

**Payload**

```json
{
    "uuid": "model_uuid"
}
```

### Reply from db_api

```json
{
    "total_devices": 10,
    "distinct_model_incidents": 5,
    "total_model_incidents": 7,
    "manufacturer_uuid": "dffc7f9a8-51c4-714a-8caf-0ebfee1e434"

}
```

## Get disease statistics (`data_03`)

### Request to db_api

**Command**

`POST`@/clinic-api-v0/disease/stats

**Payload**
```json
{
    "uuid": "disease_uuid",
    "clinic_uuid": "clinic_uuid", //optional. If not supplied will return for the whole organization
    "start_data": "YYYY-mm-dd", //optional. Default = 0001-01-01
    "end_date": "YYYY-mm-dd" // optional. Default = today()
}
```

### Reply from db_api

```json
{
    "number_of_cases": 4,
    "organization_uuid": "dffc7f9a8-51c4-714a-8caf-0ebfee1e434"
}
```

## Get patients statistics (`data_04`)

### Request to db_api

**Command**

`POST`@/clinic-api-v0/patient/stats

**Payload**
```json
{
    "clinic_uuid": "clinic_uuid", //optional. If not supplied will return for the whole organization
    "start_data": "YYYY-mm-dd", //optional. Default = 0001-01-01
    "end_date": "YYYY-mm-dd" // optional. Default = today()
}
```

### Reply from db_api

```json
{
    "number_of_patients": 10,
    "organization_uuid": "dffc7f9a8-51c4-714a-8caf-0ebfee1e434"
}
```

## Check if device is owned by organization (`data_05`)

### Request to db_api

**Command**

`POST`@/clinic-api-v0/device/is_owned

**Payload** 
```json
{
    "serial": "device_serial"
}
```

### Reply from db_api

```json
{
    "is_owned": false,
    "organization_uuid": "dffc7f9a8-51c4-714a-8caf-0ebfee1e434"
}

```

or

```json
{
    "is_owned": true,
    "clinic_name": "clinic_0_name",
    "clinic_address": "clinic_0_address",
    "organization_uuid": "dffc7f9a8-51c4-714a-8caf-0ebfee1e434"
}
```
