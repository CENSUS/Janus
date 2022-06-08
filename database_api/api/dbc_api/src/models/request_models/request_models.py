from pydantic import BaseModel, UUID4
from datetime import date
from typing import Optional
from pydantic.class_validators import root_validator

class PatientModel(BaseModel):

    uuid: Optional[UUID4]
    SSN: Optional[str]
    firstname: Optional[str]
    surname: Optional[str]
    date_of_birth: Optional[date]


class DeviceModel(BaseModel):

    uuid: Optional[UUID4]
    serial: Optional[str]


class DeviceModelModel(BaseModel):

    uuid: UUID4


class DiseaseStatsModel(BaseModel):

    uuid: UUID4
    clinic_uuid: Optional[UUID4]
    start_date: Optional[date] = date.min
    end_date: Optional[date] = date.today()


class DeviceModelOwned(BaseModel):

    serial: Optional[str]
    model: Optional[str]


class RequestData(BaseModel):

    data_type: str
    parameters: dict
    organization: Optional[str] = None

    @root_validator(pre=True)
    def extract_data_id(cls, value):
        from dbc_api.config.settings import acceptable_data_ids_check
        acceptable_types = acceptable_data_ids_check()

        acceptable_ids = acceptable_types.acceptable_data_ids
        data_id = next(iter(value))

        if data_id in acceptable_ids:
            value[data_id]['data_type'] = data_id  #Constructs a payload with e.g. {data_type = data_00, parameters = {uuid/SSN}, organization = None}
            return value[data_id]
        return {}