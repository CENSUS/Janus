# Demo

## Available Requests

### DataID Types

**Data_00**: GET PATIENT HISTORY (**DOCTOR**)
**Data_01**: CHECK DEVICE FIRMWARE (**TECHNICIAN**)
**Data_02**: GET FAULT STATS (**RESEARCHER**)
**Data_03**: GET DISEASE STATS (**RESEARCHER**)
**Data_04**: IS DEVICE OWNED (**PERSONNEL**)

| Request Type (data_id) | Data                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data_00**            | fbe11d8f-a925-4aad-a7ff-c2d965690e02 **OR** 56fa3ecb-e8d6-4975-92f6-6bb5ab7974ed **OR** 0cba7673-5157-43b0-baf9-110774431020 **OR** db1091cf-4884-4002-9db2-754761c1f14f **OR** d39d3d4f-1c39-48dc-82a3-a89ddb5d2f72                                                                                                                                                                                                                                                                                                                                                                                           |
| **Data_01**            | serial_00 (**serial**) / c9b28305-f3b1-4e52-a1b1-3d47efd89915 (**uuid**) **OR** serial_01 (**serial**) / 89fd2960-bfc0-4675-9c2f-108c1520a87a (**uuid**) **OR** serial_10 (**serial**) / d187fa6a-8afa-4f10-b113-741841abb875 (**uuid**) **OR** serial_11 (**serial**) / ba5c3957-1b1f-4f20-818d-d6f78384378c (**uuid**)                                                                                                                                                                                                                                                                                       |
| **Data_02**            | c94c2eff-66ba-4a9b-abc8-b5f3a6a580b0 **OR** d51091a2-349e-4b79-8b09-1b45614d6837 **OR** de67c119-f3e5-4d36-8ada-0e6c11d0a777 **OR** eee2594d-bef5-4843-ba1e-f03364fbddcb                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Data_03**            | **Disease UUIDs:** **_Disease_00_**: fbdc32fd-47ae-467f-ad61-29144de20402, **_Disease_01_**: 0665d650-5608-4642-b63d-2c21300691aa, **_Disease_02_**: c8c8424b-8e38-4c99-aea8-c37fc194e17d, **_Disease_03_**: ff05a670-d378-458e-bd91-170199ef58a8, **_Disease_04_**: 252b74e1-61e3-42a5-a1bf-88c6ef1a7b29, **_Disease_05_**: ab22fc3b-eb24-444c-8691-e968cf860d4a, **_Disease_06_**: acfbc991-578d-4e65-8931-ca7cff0bf4e5 - **Clinic UUIDs:** **_Clinic_0_**: 4181f798-3579-4b94-908e-71aac9dde0d0, **_Clinic_1_**: 49507389-7457-4e8b-a5ec-d5fe7f563ac6, **_Clinic_2_**: 1c53abd3-fbaa-4977-9f59-2b8723d485cb |
| **Data_04**            | model_00 **OR** model_01 **OR** model_10 **OR** model_11                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Available Clients

### Attikon Hospital

**Admin:** atho-generaladmin
**CA-Admin:** caadminatho
**Auditor:** auditoratho

| **DOCTORS**                          |              |
| ------------------------------------ | ------------ |
| **GID**                              | **Username** |
| 141debdc-cf00-417c-a7b9-b56268a984bc | docatho00    |
| b34c611a-9970-4ace-9591-5d32246bb9dd | docatho01    |
| 10b7b1ca-e993-4dc7-ae74-be54799deef5 | docatho02    |
| 2269163b-a2cd-40b0-bf86-5c2b8047b37a | docatho10    |
| 99319c9d-6dda-4cd2-9803-5b9a310cdb77 | docatho11    |

| **RESEARCHERS**                      |              |
| ------------------------------------ | ------------ |
| **GID**                              | **Username** |
| 141debdc-cf00-417c-a7b9-b56268a984bc | resatho00    |
| b34c611a-9970-4ace-9591-5d32246bb9dd | resatho01    |
| 10b7b1ca-e993-4dc7-ae74-be54799deef5 | resatho02    |
| 2269163b-a2cd-40b0-bf86-5c2b8047b37a | resatho10    |
| 99319c9d-6dda-4cd2-9803-5b9a310cdb77 | resatho11    |

| **TECHNICIANS**                      |              |
| ------------------------------------ | ------------ |
| **GID**                              | **Username** |
| 4fe6945e-5896-4bb1-89f2-2ee4a90bf6ef | techatho00   |
| b722511c-a35e-4b01-a510-5e889e9e12b5 | techatho01   |

### General Hospital of Athens

**Admin:** gehoat-generaladmin
**CA-Admin:** caadmingehoat
**Auditor:** auditorgehoat

| **DOCTORS**                          |              |
| ------------------------------------ | ------------ |
| **GID**                              | **Username** |
| a51033a3-b4c0-4b87-a902-6d472190682c | docgehoat20  |
| cf4f4bb1-d12a-4df0-97e2-ae0a4cb269e2 | docgehoat21  |

| **RESEARCHERS**                      |              |
| ------------------------------------ | ------------ |
| **GID**                              | **Username** |
| a51033a3-b4c0-4b87-a902-6d472190682c | resgehoat20  |
| cf4f4bb1-d12a-4df0-97e2-ae0a4cb269e2 | resgehoat21  |

| **TECHNICIANS**                      |              |
| ------------------------------------ | ------------ |
| **GID**                              | **Username** |
| 4fe6945e-5896-4bb1-89f2-2ee4a90bf6ef | techgehoat00 |
| aad0dbe1-54bc-4ff5-bef1-730b2bf70bef | techgehoat21 |

### Medutils

**Admin:** medutils-generaladmin
**CA-Admin:** caadminmedutils
**Auditor:** auditormedutils

| **TECHNICIANS**                      |                |
| ------------------------------------ | -------------- |
| **GID**                              | **Username**   |
| 4fe6945e-5896-4bb1-89f2-2ee4a90bf6ef | techmedutils00 |
| 3b066366-c857-4222-a2b4-e753936e4d74 | techmedutils31 |

| **PERSONNEL**                        |                |
| ------------------------------------ | -------------- |
| **GID**                              | **Username**   |
| 63112768-ba65-4a7b-a4b8-739f39d257c2 | persmedutils00 |
| 20204e7f-b36d-4793-b47c-cf7383993fa4 | persmedutils01 |

### Healthprods

**Admin:** healthprods-generaladmin
**CA-Admin:** caadminhealthprods
**Auditor:** auditorhealthprods

| **TECHNICIANS**                      |                   |
| ------------------------------------ | ----------------- |
| **GID**                              | **Username**      |
| 16746338-5570-477a-b05b-8664a1c7cce3 | techhealthprods41 |
| 3b066366-c857-4222-a2b4-e753936e4d74 | techhealthprods31 |

| **PERSONNEL**                        |                   |
| ------------------------------------ | ----------------- |
| **GID**                              | **Username**      |
| 2b32e00b-2fe6-4e77-a16a-1a1582f889bb | pershealthprods20 |
| 20204e7f-b36d-4793-b47c-cf7383993fa4 | pershealthprods21 |
