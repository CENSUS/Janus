from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from functools import partial

from sqlalchemy.sql.expression import false

from .templates import uuid_model, guid_model, id_model
from ..db.base_class import Manufacturer_Base


NullColumn = partial(Column, nullable=True)
ValidColumn = partial(Column, nullable=False)


class Manufacturer(uuid_model, Manufacturer_Base):

    name = ValidColumn(String)


class Firmware(uuid_model, Manufacturer_Base):

    version = ValidColumn(Integer)
    sha1_hash = ValidColumn(String(40))
    path = ValidColumn(String)


class Device_Model(uuid_model, Manufacturer_Base):

    name = ValidColumn(String)
    device_type = ValidColumn(String)
    shipped_firmware_uuid = ValidColumn(
        UUID(as_uuid=True), ForeignKey(Firmware.uuid))
    latest_firmware_available_uuid = ValidColumn(
        UUID(as_uuid=True), ForeignKey(Firmware.uuid))

    # one to many relationship (parent)
    devices = relationship("Manufactured_Device", back_populates='model')


class Manufacturing_Technician(guid_model, Manufacturer_Base):

    __tablename__ = "technician"

    firstname = ValidColumn(String)
    surname = ValidColumn(String)

    # one to many relationship (parent)
    contracts = relationship('Technician_Manufacturing_Contract',
                             back_populates='technician')


class Technician_Manufacturing_Contract(uuid_model, Manufacturer_Base):

    __tablename__ = "technician_contract"

    technician_guid = ValidColumn(
        UUID(as_uuid=True),
        ForeignKey(Manufacturing_Technician.guid), index=True)
    start_date = ValidColumn(Date)
    end_date = NullColumn(Date)

    # one to many relationship (child)
    technician = relationship('Manufacturing_Technician',
                              back_populates='contracts')


class Personnel(guid_model, Manufacturer_Base):

    firstname = ValidColumn(String)
    surname = ValidColumn(String)

    # one to many relationship (parent)
    contracts = relationship('Personnel_Contract',
                             back_populates='personnel')


class Personnel_Contract(uuid_model, Manufacturer_Base):

    personnel_guid = ValidColumn(
        UUID(as_uuid=True), ForeignKey(Personnel.guid), index=True)
    start_date = ValidColumn(Date)
    end_date = NullColumn(Date)

    # one to many relationship (child)
    personnel = relationship('Personnel', back_populates='contracts')


class Manufactured_Device(uuid_model, Manufacturer_Base):

    device_model_uuid = ValidColumn(
        UUID(as_uuid=True), ForeignKey(Device_Model.uuid))
    serial = ValidColumn(String, unique=True, index=True)
    current_firmware_uuid = ValidColumn(
        UUID(as_uuid=True), ForeignKey(Firmware.uuid))

    # one to many relationship (child)
    incidents = relationship('Incident', back_populates='device')

    # one to many relationship (child)
    model = relationship('Device_Model', back_populates='devices')


class Incident(id_model, Manufacturer_Base):

    device_serial = ValidColumn(String, ForeignKey(
        Manufactured_Device.serial), index=True)
    time = ValidColumn(DateTime)
    # description = ValidColumn(String)
    # report_path = ValidColumn(String)

    # one to one relationship (parent)
    grouped_incident = relationship('Group_Incident', back_populates='incident', uselist=False, lazy='joined')

    # one to many relationship (child)
    device = relationship('Manufactured_Device', back_populates='incidents')

class Group_Incident(id_model, Manufacturer_Base):

    incident_id = ValidColumn(Integer, ForeignKey(
        Incident.id), index=True)

    # Sensitive/Resticted Data
    description = ValidColumn(String)
    report_path = ValidColumn(String)
    wrapped_encryption_key = ValidColumn(String)

    # one to one relationship (child)
    incident = relationship('Incident', back_populates='grouped_incident')
