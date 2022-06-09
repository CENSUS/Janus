from datetime import datetime, date
from pydantic import BaseModel, UUID4
from typing import List, Optional
from .common import UUIDSchema, IDSchema, GUIDSchema
from .common import Technician, Technician_Contract
from ..models import Role
from marshmallow_sqlalchemy import SQLAlchemySchema, auto_field

class Organization(UUIDSchema):

    name: str
    logo_url: str

class Clinic(UUIDSchema):

    name: str
    address: str


class Patient(UUIDSchema):

    SSN: str
    firstname: str
    surname: str
    # weight: int
    # address: str
    date_of_birth: date
    # date_of_birth: str

class PatientAccessible(UUIDSchema):
    SSN: str

class PatientResponse(UUIDSchema):
    SSN: str
    firstname: str
    surname: str
    weight: str
    address: str
    date_of_birth: str
    wrapped_encryption_key: str

class Group_Patient(UUIDSchema):

    patient_uuid: UUID4
    # Sensitive/Resticted Data
    firstname: str
    surname: str
    weight: str
    address: str
    date_of_birth: str
    wrapped_encryption_key: str


class PatientRequest(BaseModel):

    uuid: Optional[UUID4]
    SSN: Optional[str]
    firstname: Optional[str]
    surname: Optional[str]
    date_of_birth: Optional[date]


class DateRangeRequest(BaseModel):

    start_date: Optional[date] = date.min
    end_date: Optional[date] = date.today()


class PatientStatsRequest(DateRangeRequest):

    clinic_uuid: Optional[UUID4]


class Patient_Stats(BaseModel):

    number_of_patients: int


class Doctor(GUIDSchema):

    firstname: str
    surname: str
    specialty: str


class Doctor_Contract(UUIDSchema):

    doctor_guid: UUID4
    start_date: date
    end_date: Optional[date]
    role: Role = Role.doctor
    clinic_stationed_uuid: Optional[UUID4]


class ER_Duty(IDSchema):

    start_time: datetime
    end_time: datetime
    doctor_contract_uuid: UUID4

class Treatment(UUIDSchema):

    clinic_uuid: UUID4
    patient_uuid: UUID4
    start_date: date
    last_update_date: date
    end_date: Optional[date]
    # description: str
    status: str

class Group_Treatment(UUIDSchema):
    treatment_uuid: UUID4
    # Sensitive/Resticted Data
    description: str
    wrapped_encryption_key: str

class TreatmentResponse(UUIDSchema):
    clinic_uuid: UUID4
    patient_uuid: UUID4
    start_date: date
    last_update_date: date
    end_date: Optional[date]
    status: str

    grouped_treatment: Group_Treatment


class Prescription(UUIDSchema):

    treatment_uuid: UUID4
    doctor_contract_uuid: UUID4
    entry_time: datetime
    # prescription_path: str  # Path

class Group_Prescription(UUIDSchema):

    prescription_uuid: UUID4
    # Sensitive/Resticted Data
    prescription_path: str
    wrapped_encryption_key: str

class PrescriptionResponse(UUIDSchema):

    treatment_uuid: UUID4
    doctor_contract_uuid: UUID4
    entry_time: datetime

    grouped_prescription: Group_Prescription

class Disease(UUIDSchema):

    name: str
    description: str
    symptoms: str


class DiseaseStatsRequest(DateRangeRequest):

    uuid: UUID4
    clinic_uuid: Optional[UUID4]


class Disease_Stats(BaseModel):

    number_of_cases: int
    clinic_uuid: Optional[UUID4]


class Diagnosis(UUIDSchema):

    treatment_uuid: UUID4
    doctor_contract_uuid: UUID4
    entry_time: datetime
    # diagnosis_data: str
    disease_uuid: UUID4

class Group_Diagnosis(UUIDSchema):

    diagnosis_uuid: UUID4
    # Sensitive/Resticted Data
    diagnosis_data: str
    wrapped_encryption_key: str

class DiagnosisResponse(UUIDSchema):
    treatment_uuid: UUID4
    doctor_contract_uuid: UUID4
    entry_time: datetime
    disease_uuid: UUID4

    grouped_diagnosis: Group_Diagnosis

class Diagnostic_Test(UUIDSchema):

    diagnosis_uuid: Optional[UUID4]
    test_type: str
    entry_time: datetime
    # test_data: str

class Group_Diagnostic_Test(UUIDSchema):

    diagnostic_test_data_uuid: UUID4
    # Sensitive/Resticted Data
    test_data: str
    wrapped_encryption_key: str

class Diagnostic_TestResponse(UUIDSchema):

    diagnosis_uuid: Optional[UUID4]
    test_type: str
    entry_time: datetime
    # test_data: str
    grouped_diagnostic_test_data: Group_Diagnostic_Test

class Medical_Device(UUIDSchema):

    serial: str
    manufacturer: str
    model: str
    install_date: date
    last_maintenance_id: Optional[int]
    next_required_maintenance_date: date
    clinic_uuid: UUID4

class MedicalDeviceOwned(BaseModel):

    clinic_name: Optional[str]
    clinic_uuid: Optional[UUID4]
    clinic_address: Optional[str]
    device_serial: Optional[str]
    device_manufacturer: Optional[str]

class MedicalDevicesOwned(BaseModel):

    is_owned: bool
    total_devices: Optional[int]
    devices: Optional[List[MedicalDeviceOwned]]

class Maintenance(IDSchema):

    device_uuid: UUID4
    description: str
    technician_contract_uuid: UUID4
    start_time: datetime
    end_time: datetime


class full_Clinic(Clinic):

    contracts: List[Doctor_Contract]
    treatments: List[Treatment]
    devices: List[Medical_Device]


class full_Patient(PatientResponse):

    treatments: List[TreatmentResponse]
    prescriptions: List[PrescriptionResponse]
    diagnoses: List[DiagnosisResponse]

class full_Doctor(Doctor):

    contracts: List[Doctor_Contract]


class full_Doctor_Contract(Doctor_Contract):

    # parent
    er_duties: List[ER_Duty]
    prescriptions: List[PrescriptionResponse]
    diagnoses: List[DiagnosisResponse]

    # child
    clinic: Clinic
    doctor: Doctor


class full_ER_Duty(ER_Duty):

    contract: Doctor_Contract


class full_Treatment(TreatmentResponse):

    # parent
    prescriptions: List[PrescriptionResponse]
    diagnoses: List[DiagnosisResponse]

    # clinic
    patient: PatientResponse
    clinic: Clinic


class full_Prescription(Prescription):

    # child
    treatment: Treatment
    contract: Doctor_Contract


class full_Disease(Disease):

    dignoses: List[DiagnosisResponse]


class full_Diagnosis(Diagnosis):

    # parent
    tests: List[Diagnostic_TestResponse]

    # child
    treatment: TreatmentResponse
    contract: Doctor_Contract
    disease: Disease


class full_Diagnostic_Test(Diagnostic_Test):

    diagnosis: Optional[DiagnosisResponse]


class full_Technician_Contract(Technician_Contract):

    maintenances: List[Maintenance]

    technician: Technician


class full_Medical_Device(Medical_Device):

    last_maintenance: Maintenance

    clinic: Clinic


class full_Maintenance(Maintenance):

    contract: Technician_Contract

    device: Medical_Device
