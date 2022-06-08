_________________________________________________________________________________________________________________________________________________________________
|                                                                                                                                                               |
|            ## Attributes                                                                                                                                      |    
|            | Attribute_Name          |                                                                                                                        |
|            | ----------------------- |                                                                                                                        |
|            | Doctor                  |                                                                                                                        |
|            | On_Call                 |                                                                                                                        |
|            | Researcher              |                                                                                                                        |
|            | Manufacturer            |                                                                                                                        |
|            | Clinic                  |                                                                                                                        |
|            | Clinic_Technician       |                                                                                                                        |   
|            | Manufacturer_Technician |                                                                                                                        |
|            | Manufacturer_Staff      |                                                                                                                        |
|            | Clinic_Staff            |                                                                                                                        |
|                                                                                                                                                               |
|_______________________________________________________________________________________________________________________________________________________________|
|                                                                                                                                                               |
|           ## KEY PRINCIPALS                                                                                                                                   |
|           |--------------------------------------------------------------------------------------------------|                                                |
|           |        ENTITY          |                           KEY PRINCIPALS                                |                                                |
|           |------------------------|-------------------------------------------------------------------------|                                                |
|           |       RESEARCHER       |   STATIC DOMAIN-WIDE KEY TO BE USED BY ANY RESEARCHER                   |                                                |
|           |                        |                                                                         |                                                |
|           |    CLINIC_TECHNICIAN   |   STATIC HOSPITAL-SPECIFIC KEY TO BE USED BY ANY TECHNICIAN IN HOSPITAL |                                                |
|           |                        |                                                                         |                                                |
|           |        DOCTOR          |   STATIC DOMAIN-WIDE KEY TO BE USED BY A PATIENT'S DOCTOR               |                                                |
|           |                        |                                                                         |                                                |
|           |       DOCTOR_ER        |   STATIC DOMAIN-WIDE KEY TO BE USED BY AN EMERGENCY (ER/On Call) DOCTOR |                                                |
|           |                        |                                                                         |                                                |
|           |  MANUFACTURING_STAFF   |   STATIC DOMAIN-WIDE KEY TO BE USED BY THE MANUFACTURING STAFF OF A     |                                                |
|           |                        |                              MANUFACTURER                               |                                                |
|_______________________________________________________________________________________________________________________________________________________________|
|                                                                                                                                                               |
|            ## Request IDs ( `data_id` )                                                                                                                       |
|                                                                                                                                                               |
|            | Request_ID | Description                                                                          | Poster              | Target       |         |
|            | ---------- | ------------------------------------------------------------------------------------ | ------------------- | ------------ |         |
|            | data_00    | Get a patient's history. Requires field `data`                                       | Doctor              | Hospitals    |         |
|            | data_01    | Check if a device's firmware is patched to the latest version. Requires field `data` | Clinic_Technician   | Manufacturer |         |
|            | data_02    | Get fault statistics for a device model. Requires field `data`                       | Researcher          | Manufacturer |         |
|            | data_03    | Get diseases' statistics for a given disease. Requires field `data`                  | Researcher          | Hospitals    |         |
|            | data_04    | Which Clinics own a specific device model. Requires field `data`                     | Manufacturing_Staff | Hospitals    |         |
|                                                                                                                                                               |
|            | Request ID | Data                                                                                                        |                       |
|            | ---------- | ----------------------------------------------------------------------------------------------------------- |                       |
|            | data_00    | {"SSN": "patient_SSN"}                                                                                      |                       |
|            | data_01    | {"serial": "device_serial"}                                                                                 |                       |                    
|            | data_02    | {"uuid": "model_uuid"}                                                                                      |                       |
|            | data_03    | {"uuid": "disease_uuid"}                                                                                    |                       |
|            | data_04    | {"uuid": "device_serial"}                                                                                  |                       |
|_______________________________________________________________________________________________________________________________________________________________|
|                                                                                                                                                               |
|            | Request ID | Privileges                                                                                                  |                       |
|            | ---------- | ----------------------------------------------------------------------------------------------------------- |                       |
|            | data_00    | Let ***a*** be a doctor at hospital ***x*** and ***b*** a patient of that doctor                            |                       |
|            |            |                 **a.isDoctorAtHospital(x) AND a.isTreating(b)**                                             |                       |
|            |            |                                         **OR**                                                              |                       |
|            |            |                 **a.isDoctorAtHospital(x) AND a.onDutyAt(x)**                                               |                       |
|            |            |                                                                                                             |                       |
|            | data_01    | Let ***a*** be a technician at hospital ***x***                               			                        |                       |
|            |            |                 **a.isActiveTechnicianAt(x)**                                                               |                       |
|            |            |                                                                                                             |                       |
|            | data_02    | Let ***a*** be a researcher at hospital ***x***                                                             |                       |
|            |            |                 **a.isResearcherAt(x)**                                                                     |                       |
|            |            |                                                                                                             |                       |
|            | data_03    | Let ***a*** be a researcher at hospital ***x***                                                             |                       |
|            |            |                 **a.isResearcherAt(x)**                                                                     |                       |
|            |            |                                                                                                             |                       |
|            | data_04    | Let ***a*** be the manufacturing staff of a manufacturer ***x*** and ***b*** a hospital                     |                       |
|            |            |                 **x.worksAt(x)**                                                                            |                       |
|            |            |                                                                                                             |                       |
|_______________________________________________________________________________________________________________________________________________________________|
