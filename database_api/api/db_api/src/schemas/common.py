from pydantic import BaseModel, Field, UUID4, BaseConfig
from datetime import date
from typing import Optional, List
from uuid import uuid4


class UUIDSchema(BaseModel):

    uuid: Optional[UUID4] = Field(default_factory=uuid4)

    class Config:

        orm_mode = True


class GUIDSchema(BaseModel):

    guid: Optional[UUID4] = Field(default_factory=uuid4)

    class Config:

        orm_mode = True


class IDSchema(BaseModel):

    id: Optional[int]

    class Config:

        orm_mode = True


class DeviceRequest(BaseModel):

    uuid: Optional[UUID4]
    model: Optional[str]
    serial: Optional[str]


class Technician(GUIDSchema):

    firstname: str
    surname: str


class Technician_Contract(UUIDSchema):

    technician_guid: UUID4
    start_date: date
    end_date: Optional[date]


class full_Technician(Technician):

    contracts: List[Technician_Contract]
