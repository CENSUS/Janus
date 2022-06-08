# JWT

The algorithm used for JWT signing will be RS256(SHA).
This requires a private/public key infrastructure between the Proxy and the Domain Blockchains.

## JWT fields

1) Header Fields


    | Field Name       | Description    | Value(s) |
    | ---------------- | -------------- | -------- |
    | `alg` | Algorithm Used | RS256    |
    | `typ` (optional) | type of token  | JWT      |

2) Payload

    | Field Name       | Description                                                   | Value(s)              |
    | ---------------- | ------------------------------------------------------------- | --------------------- |
    | `jti` | JWT ID                                                                   | UUID                  |
    | `iss` | Issuer ID                                                                | UUID                  |
    | `iat` | Issued at (time)                                                         | NumericDatetime       |
    | `exp` | Expiration Time                                                          | NumericDatetime       |
    | `nbf` | Not to be used before Time                                               | NumericDatetime       |
    | `aud` | The audience the request is intended for                                 | domain_bc_uuid        |
    | `type` | The type of payload. Either a request for data, or a response           | REQ/RESP              |
    | `GUID` | Unique Identifier of the person making the request                      | UUID4                 |
    | `verified_attrs` | List of attribute ids that have been verified for the request | [doctor, on_call, ..] |
    | `data_id` | The ID of the data request                                           | patient_history       |
    | `data` | Complimentary data for the request, eg patient's SSN                    | patient_SSN           |

3) Signature



```
RSASHA256(
    base64UrlEncode(header) + "." +
    base64UrlEncode(payload),
    public_key/private_key
)
```

## Attributes

| Attribute_Name          |
| ----------------------- |
| Doctor                  |
| On_Call                 |
| Researcher              |
| Manufacturer            |
| Clinic                  |
| Clinic_Technician       |
| Manufacturer_Technician |
| Manufacturer_Staff      |
| Clinic_Staff            |

## Request IDs ( `data_id` )

| Request_ID | Description                                                                          | Poster              | Target       |
| ---------- | ------------------------------------------------------------------------------------ | ------------------- | ------------ |
| data_00    | Get a patient's history. Requires field `data`                                       | Doctor              | Hospitals    |
| data_01    | Check if a device's firmware is patched to the latest version. Requires field `data` | Clinic_Technician   | Manufacturer |
| data_02    | Get fault statistics for a device model. Requires field `data`                       | Researcher          | Manufacturer |
| data_03    | Get diseases statistics for a given disease. Requires field `data`                   | Researcher          | Hospitals    |
| data_04    | Which Clinics own a specific device model. Requires field `data`                     | Manufacturing_Staff | Hospitals    |

| Request ID | Data                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| data_00    | {"SSN": "patient_SSN"}                                                                                      |
| data_01    | {"serial": "device_serial"}                                                                                 |
| data_02    | {"uuid": "model_uuid"}                                                                                      |
| data_03    | {"uuid": "disease_uuid"                                                                                     |
| data_04    | {"uuid": "model_uuid"}                                                                                      |


# Notes

To generate the keys that will be used for the JWT signing check
[setup_jwt](./docs/setup_jwt.md)


```bash
python bin/gen_RSA_keys.py <key_file_name>

```

or

```bash
ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key

openssl rsa -in jwtRS256.key -pubout > jwtRS256.key.pub
```