from datetime import date, datetime
from pydantic import UUID4, BaseModel
from typing import Dict, Optional

from .common import UUIDSchema, IDSchema, GUIDSchema


class Manufacturer(UUIDSchema):

    name: str


class Firmware(UUIDSchema):

    version: int
    sha1_hash: str
    path: str


class Device_Model(UUIDSchema):

    name: str
    device_type: str
    shipped_firmware_uuid: UUID4
    latest_firmware_available_uuid: UUID4


class Manufactured_Device(UUIDSchema):

    device_model_uuid: UUID4
    serial: str
    current_firmware_uuid: UUID4


class Personnel(GUIDSchema):

    firstname: str
    surname: str


class Personnel_Contract(UUIDSchema):

    personnel_guid: UUID4
    start_date: date
    end_date: Optional[date]


class Incident(IDSchema):

    device_serial: Optional[str]
    time: Optional[datetime]
    # description: str
    # report_path: str

class IncidentResponse(IDSchema):

    device_serial: str
    time: datetime
    # Sensitive/Resticted Data
    description: str
    report_path: str
    wrapped_encryption_key: str

class Group_Incident(IDSchema):

    incident_id: int
    # Sensitive/Resticted Data
    description: str
    report_path: str
    wrapped_encryption_key: str

class Model_Incident_Stats(BaseModel):

    total_devices: int
    distinct_model_incidents: int = 0
    total_model_incidents: int = 0

class Device_Firmware_Check(BaseModel):

    is_up_to_date: bool
    latest_firmware: UUID4
    current_firmware: UUID4
