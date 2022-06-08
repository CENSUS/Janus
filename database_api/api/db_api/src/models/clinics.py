import enum
from functools import partial
from typing import Any, AnyStr

from pydantic.networks import stricturl
from sqlalchemy import (Column, Date, DateTime, Enum, ForeignKey, Integer,
                        String)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from yaml.parser import ParserError

from ..db.base_class import Hospital_Base
from .templates import guid_model, id_model, uuid_model

NullColumn = partial(Column, nullable=True)
ValidColumn = partial(Column, nullable=False)


class Role(str, enum.Enum):
    doctor = 'Doctor'
    researcher = 'Researcher'


class Organization(uuid_model, Hospital_Base):

    name = ValidColumn(String)
    logo_url = ValidColumn(String)


class Clinic(uuid_model, Hospital_Base):

    name = ValidColumn(String)
    address = ValidColumn(String)

    # one to many relationship (parent)
    contracts = relationship('Doctor_Contract', back_populates='clinic')
    treatments = relationship('Treatment', back_populates='clinic')
    devices = relationship('Medical_Device', back_populates='clinic')

# class Patient(uuid_model, Hospital_Base):

#     SSN = ValidColumn(String, unique=True)
#     firstname = ValidColumn(String)
#     surname = ValidColumn(String)
#     # weight = ValidColumn(Integer)
#     # address = ValidColumn(String)
#     date_of_birth = ValidColumn(Date)
#     # one to many relationship (parent)
#     treatments = relationship('Treatment', back_populates='patient')
#     group_patient = relationship('Group_Patient', back_populates='patient')

# class Group_Patient(uuid_model, Hospital_Base):
#     patient = ValidColumn(String, ForeignKey(Patient.SSN), index=True)

#     # Sensitive/Resticted Data
#     firstname = ValidColumn(String)
#     surname = ValidColumn(String)
#     weight = ValidColumn(String)
#     address = ValidColumn(String)
#     date_of_birth = ValidColumn(String)
#     wrapped_encryption_key = ValidColumn(String)

#     #patient = Column(UUID(as_uuid=True), ForeignKey("patient.uuid"))
#     # one to many relationship (child)
#     #patient = relationship('Patient', back_populates='group_patient', uselist=False)
#     #patient = relationship('Patient', back_populates='group_patient')
#########################################
class Patient(uuid_model, Hospital_Base):

    SSN = ValidColumn(String, unique=True)
    firstname = ValidColumn(String)
    surname = ValidColumn(String)
    # weight = ValidColumn(Integer)
    # address = ValidColumn(String)
    date_of_birth = ValidColumn(Date)
    # one to many relationship (parent)
    treatments = relationship('Treatment', back_populates='patient')

    # one to one relationship (parent)
    group_patient = relationship('Group_Patient',
                                    back_populates='patient', uselist=False, lazy='joined')

class Group_Patient(uuid_model, Hospital_Base):

    patient_uuid = ValidColumn(UUID(as_uuid=True), ForeignKey(
         Patient.uuid), index=True)

    # Sensitive/Resticted Data
    firstname = ValidColumn(String)
    surname = ValidColumn(String)
    weight = ValidColumn(String)
    address = ValidColumn(String)
    date_of_birth = ValidColumn(String)
    wrapped_encryption_key = NullColumn(String)

    # one to many relationship (child)
    # patient = relationship(
    #     'Patient', primaryjoin=patient_uuid == Patient.uuid,
    #     foreign_keys=patient_uuid, post_update=True)
    patient = relationship('Patient', back_populates='group_patient')

###############################
class Doctor(guid_model, Hospital_Base):

    firstname = ValidColumn(String)
    surname = ValidColumn(String)
    specialty = ValidColumn(String)

    # one to many relationship (parent)
    contracts = relationship('Doctor_Contract', back_populates='doctor', lazy='dynamic')


class Doctor_Contract(uuid_model, Hospital_Base):

    doctor_guid = ValidColumn(UUID(as_uuid=True), ForeignKey(Doctor.guid))
    start_date = ValidColumn(Date)
    end_date = NullColumn(Date)
    role = ValidColumn(Enum(Role), validate_string=True)
    clinic_stationed_uuid = NullColumn(
        UUID(as_uuid=True), ForeignKey(Clinic.uuid))

    # one to many relationship (parent)
    er_duties = relationship('ER_Duty', back_populates='contact')
    prescriptions = relationship('Prescription', back_populates='contract')
    diagnoses = relationship('Diagnosis', back_populates='contract')

    # one to many relationship (child)
    clinic = relationship('Clinic', back_populates='contracts')
    doctor = relationship('Doctor', back_populates='contracts')


class ER_Duty(id_model, Hospital_Base):

    start_time = ValidColumn(DateTime)
    end_time = ValidColumn(DateTime)
    doctor_contract_uuid = ValidColumn(
        UUID(as_uuid=True), ForeignKey(Doctor_Contract.uuid))

    # one to many relationship (child)
    contact = relationship('Doctor_Contract', back_populates='er_duties')


class Treatment(uuid_model, Hospital_Base):

    clinic_uuid = ValidColumn(UUID(as_uuid=True),
                              ForeignKey(Clinic.uuid), index=True)
    patient_uuid = ValidColumn(UUID(as_uuid=True),
                               ForeignKey(Patient.uuid), index=True)
    start_date = ValidColumn(Date)
    last_update_date = ValidColumn(Date)
    end_date = NullColumn(Date)
    # description = ValidColumn(String)
    status = ValidColumn(String)

    # one to many relationship (parent)
    prescriptions = relationship('Prescription', back_populates='treatment')
    diagnoses = relationship('Diagnosis', back_populates='treatment')
    # one to one relationship (parent)
    grouped_treatment = relationship('Group_Treatment', back_populates='treatment', uselist=False, lazy='joined')

    # one to many relationship (child)
    patient = relationship('Patient', back_populates='treatments')
    clinic = relationship('Clinic', back_populates='treatments')

class Group_Treatment(uuid_model, Hospital_Base):

    treatment_uuid = ValidColumn(UUID(as_uuid=True),
                               ForeignKey(Treatment.uuid), index=True)

    # Sensitive/Resticted Data
    description = ValidColumn(String)
    wrapped_encryption_key = ValidColumn(String)

    # one to many relationship (child)
    treatment = relationship('Treatment', back_populates='grouped_treatment')

class Prescription(uuid_model, Hospital_Base):

    treatment_uuid = ValidColumn(
        UUID(as_uuid=True), ForeignKey(Treatment.uuid), index=True)
    doctor_contract_uuid = ValidColumn(
        UUID(as_uuid=True), ForeignKey(Doctor_Contract.uuid))
    entry_time = ValidColumn(DateTime)
    # prescription_path = ValidColumn(String)

    # one to many relationship (parent)
    grouped_prescription = relationship('Group_Prescription', back_populates='prescription', uselist=False, lazy='joined')

    # one to many relationship (child)
    treatment = relationship('Treatment', back_populates='prescriptions')
    contract = relationship('Doctor_Contract', back_populates='prescriptions')

class Group_Prescription(uuid_model, Hospital_Base):

    prescription_uuid = ValidColumn(UUID(as_uuid=True),
                               ForeignKey(Prescription.uuid), index=True)

    # Sensitive/Resticted Data
    prescription_path = ValidColumn(String)
    wrapped_encryption_key = ValidColumn(String)

    # one to many relationship (child)
    prescription = relationship('Prescription', back_populates='grouped_prescription')


class Disease(uuid_model, Hospital_Base):

    name = ValidColumn(String)
    description = ValidColumn(String)
    symptoms = ValidColumn(String)

    # one to many relationship (parent)
    diagnoses = relationship('Diagnosis', back_populates='disease')


class Diagnosis(uuid_model, Hospital_Base):

    treatment_uuid = ValidColumn(
        UUID(as_uuid=True), ForeignKey(Treatment.uuid), index=True)
    doctor_contract_uuid = ValidColumn(
        UUID(as_uuid=True), ForeignKey(Doctor_Contract.uuid), index=True)
    entry_time = ValidColumn(DateTime)
    # diagnosis_data = ValidColumn(String)
    disease_uuid = NullColumn(UUID(as_uuid=True), ForeignKey(Disease.uuid))

    # one to many relationship (parent)
    tests = relationship('Diagnostic_Test_Data', back_populates='diagnosis')
    grouped_diagnosis = relationship('Group_Diagnosis', back_populates='diagnosis', uselist=False, lazy='joined')

    # one to many relationship (child)
    treatment = relationship('Treatment', back_populates='diagnoses')
    contract = relationship('Doctor_Contract', back_populates='diagnoses')
    disease = relationship('Disease', back_populates='diagnoses')

class Group_Diagnosis(uuid_model, Hospital_Base):

    diagnosis_uuid = ValidColumn(UUID(as_uuid=True),
                               ForeignKey(Diagnosis.uuid), index=True)

    # Sensitive/Resticted Data
    diagnosis_data = ValidColumn(String)
    wrapped_encryption_key = ValidColumn(String)

    # one to many relationship (child)
    diagnosis = relationship('Diagnosis', back_populates='grouped_diagnosis')

class Diagnostic_Test_Data(uuid_model, Hospital_Base):

    diagnosis_uuid = NullColumn(
        UUID(as_uuid=True), ForeignKey(Diagnosis.uuid), index=True)
    test_type = ValidColumn(String)
    entry_time = ValidColumn(DateTime)
    # test_data = ValidColumn(String)

    # one to many relationship (parent)
    grouped_diagnostic_test_data = relationship('Group_Diagnostic_Test_Data', back_populates='diagnostic_test_data', uselist=False)

    # one to many relationship (child)
    diagnosis = relationship('Diagnosis', back_populates='tests')

class Group_Diagnostic_Test_Data(uuid_model, Hospital_Base):

    diagnostic_test_data_uuid = ValidColumn(UUID(as_uuid=True),
                               ForeignKey(Diagnostic_Test_Data.uuid), index=True)

    # Sensitive/Resticted Data
    test_data = ValidColumn(String)
    wrapped_encryption_key = ValidColumn(String)

    # one to many relationship (child)
    diagnostic_test_data = relationship('Diagnostic_Test_Data', back_populates='grouped_diagnostic_test_data')

class Technician(guid_model, Hospital_Base):

    firstname = ValidColumn(String)
    surname = ValidColumn(String)

    # one to many relationship (parent)
    contracts = relationship('Technician_Contract',
                             back_populates='technician')


class Technician_Contract(uuid_model, Hospital_Base):

    technician_guid = ValidColumn(
        UUID(as_uuid=True), ForeignKey(Technician.guid), index=True)
    start_date = ValidColumn(Date)
    end_date = NullColumn(Date)

    # one to many relationship (parent)
    maintenances = relationship('Medical_Device_Maintenance',
                                back_populates='contract')

    # one to many relationship (child)
    technician = relationship('Technician', back_populates='contracts')


class Medical_Device(uuid_model, Hospital_Base):

    serial = ValidColumn(String, index=True, unique=True)
    manufacturer = ValidColumn(String)
    model = ValidColumn(String)
    install_date = ValidColumn(Date)
    last_maintenance_id = NullColumn(
        Integer, ForeignKey("medical_device_maintenance.id"))
    next_required_maintenance_date = ValidColumn(Date)
    clinic_uuid = ValidColumn(UUID(as_uuid=True),
                              ForeignKey(Clinic.uuid), index=True)

    # one to many relationship (parent)
    last_maintenance = relationship('Medical_Device_Maintenance',
                                    back_populates='device',
                                    foreign_keys=last_maintenance_id)

    # one to many relationship (child)
    clinic = relationship('Clinic', back_populates='devices')


class Medical_Device_Maintenance(id_model, Hospital_Base):

    device_uuid = ValidColumn(UUID(as_uuid=True), ForeignKey(
        Medical_Device.uuid), index=True)
    description = ValidColumn(String)
    technician_contract_uuid = ValidColumn(
        UUID(as_uuid=True), ForeignKey(Technician_Contract.uuid), index=True)
    start_time = Column(DateTime)
    end_time = Column(DateTime)

    # one to many relationship (child)
    contract = relationship('Technician_Contract',
                            back_populates='maintenances')
    device = relationship(
        'Medical_Device', primaryjoin=device_uuid == Medical_Device.uuid,
        foreign_keys=device_uuid, post_update=True)
