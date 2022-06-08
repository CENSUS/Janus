from json import load
from typing import Dict
import uuid
from pydantic.main import BaseModel
from sqlalchemy.orm import Session, Load
from sqlalchemy import or_, and_, func
from pydantic import UUID4
from datetime import date

from sqlalchemy.orm.strategy_options import joinedload

from ...src import models, schemas
from .common import get_by_uuid, create

def get_organization(db: Session):
    return db.query(models.Organization).first()


###############################################################################
# /clinic
###############################################################################


def get_clinics(db: Session):
    return db.query(models.Clinic).all()


def get_clinic(db: Session, clinic_uuid: UUID4):
    return get_by_uuid(db, models.Clinic, clinic_uuid)


def get_doctors_from_clinic(db: Session, clinic_uuid: UUID4):
    contracts = db.query(models.Doctor_Contract).filter_by(
        clinic_stationed_uuid=clinic_uuid).all()
    doctors = [contract.doctor for contract in contracts]
    return doctors


###############################################################################
# /doctor
###############################################################################


def get_doctors(db: Session):
    contracts = db.query(models.Doctor_Contract).filter_by(
        role=models.Role.doctor).all()
    return [c.doctor for c in contracts]


def get_doctor(db: Session, doctor_guid: UUID4):
    contract = db.query(models.Doctor_Contract).filter_by(
        role=models.Role.doctor, doctor_guid=doctor_guid).first()
    if contract:
        return contract.doctor
    else:
        return None


def get_doctor_active_contracts(db: Session, doctor_guid: UUID4):
    contracts = db.query(models.Doctor_Contract).filter_by(
        role=models.Role.doctor, doctor_guid=doctor_guid).filter(
        or_(models.Doctor_Contract.end_date >= date.today(),
            models.Doctor_Contract.end_date == None)).all()
    return contracts


###############################################################################
# /researcer
###############################################################################


def get_researchers(db: Session):
    contracts = db.query(models.Doctor_Contract).filter_by(
        role=models.Role.researcher).all()
    return [c.researcher for c in contracts]


def get_researcher(db: Session, doctor_guid: UUID4):
    contract = db.query(models.Doctor_Contract).filter_by(
        role=models.Role.researcher, doctor_guid=doctor_guid).first()
    if contract:
        return contract.doctor
    else:
        return None


def get_researcher_active_contracts(db: Session, doctor_guid: UUID4):
    contracts = db.query(models.Doctor_Contract).filter_by(
        role=models.Role.researcher, doctor_guid=doctor_guid).filter(
        or_(models.Doctor_Contract.end_date >= date.today(),
            models.Doctor_Contract.end_date == None)).all()
    return contracts


###############################################################################
# /patient
###############################################################################


def get_patients(db: Session):
    return db.query(models).all()

def get_patient(db: Session, patient_uuid: UUID4):
    query = db.query(models.Patient).options(Load(models.Patient).load_only(models.Patient.SSN))
    query = query.filter_by(uuid=patient_uuid)
    return query.first()

def get_patient_by_name(db: Session,
                        patient: schemas.PatientRequest):
    query = db.query(models.Patient).options(Load(models.Patient).load_only(models.Patient.SSN))
    query = query.filter_by(firstname=patient.firstname,
                            surname=patient.surname,
                            date_of_birth=patient.date_of_birth)
    return query.first()


def get_patient_by_ssn(db: Session, ssn: str):
    query = db.query(models.Patient).options(Load(models.Patient).load_only(models.Patient.SSN))
    query = query.filter_by(SSN=ssn)
    return query.first()


def get_patient_stats(db: Session, patient_request: schemas.PatientStatsRequest):

    start_date = patient_request.start_date
    end_date = patient_request.end_date
    clinic_uuid = patient_request.clinic_uuid

    treatments_by_date = db.query(func.count(models.Treatment.uuid), models.Treatment.patient_uuid).filter(
        and_(and_(models.Treatment.start_date >= start_date,
                  models.Treatment.start_date <= end_date),
             or_(models.Treatment.end_date <= end_date,
                 models.Treatment.end_date == None))).group_by(
        models.Treatment.patient_uuid)

    if clinic_uuid:
        if not get_clinic(db, clinic_uuid):
            return None
        treatments_by_date = treatments_by_date.filter_by(
            clinic_uuid=clinic_uuid)

    num_of_patients = treatments_by_date.all()

    return {'number_of_patients': len(num_of_patients)}

###############################################################################
# /treatment
###############################################################################


def get_treatment(db: Session, treatment_uuid: UUID4):
    return get_by_uuid(db, models.Treatment, treatment_uuid)


###############################################################################
# /prescription
###############################################################################

def get_prescription(db: Session, prescription_uuid: UUID4):
    return get_by_uuid(db, models.Prescription, prescription_uuid)


###############################################################################
# /disease
###############################################################################

def get_diseases(db: Session):
    return db.query(models.Disease).all()


def get_disease(db: Session, disease_uuid: UUID4):
    return get_by_uuid(db, models.Disease, disease_uuid)


def get_disease_stats(db: Session, disease_request=schemas.DiseaseStatsRequest):

    start_date = disease_request.start_date
    end_date = disease_request.end_date
    clinic_uuid = disease_request.clinic_uuid

    diagnoses = db.query(models.Disease).filter_by(
        uuid=disease_request.uuid).join(
        models.Diagnosis).filter(
        and_(models.Diagnosis.entry_time >= start_date,
             models.Diagnosis.entry_time <= end_date))

    treatments = diagnoses.join(models.Treatment)

    if clinic_uuid:
        if not get_clinic(db, clinic_uuid):
            return None
        number_of_cases = treatments.filter_by(clinic_uuid=clinic_uuid).count()
    else:
        number_of_cases = treatments.count()

    return {'number_of_cases': number_of_cases}


###############################################################################
# /diagnosis
###############################################################################


def get_diagnoses(db: Session):
    return db.query(models.Diagnosis).all()


def get_diagnosis(db: Session, diagnosis_uuid: UUID4):
    return get_by_uuid(db, models.Diagnosis, diagnosis_uuid)


###############################################################################
# /diagnostic_tests
###############################################################################


def get_tests(db: Session):
    return db.query(models.Diagnostic_Test_Data).all()


def get_test(db: Session, test_uuid: UUID4):
    return get_by_uuid(db, models.Diagnostic_Test_Data, test_uuid)


###############################################################################
# /technician
###############################################################################


def get_technicians(db: Session):
    return db.query(models.Technician).all()


def get_technician(db: Session, technician_guid: UUID4):
    return get_by_uuid(db, models.Technician, technician_guid)


def get_technician_active_contracts(db: Session, technician_guid: UUID4):
    contracts = db.query(models.Technician_Contract).filter_by(
        technician_guid=technician_guid).filter(
        or_(models.Technician_Contract.end_date >= date.today(),
            models.Technician_Contract.end_date == None)).all()
    return contracts

###############################################################################
# /device
###############################################################################


def get_medical_devices(db: Session):
    return db.query(models.Medical_Device).all()


def get_medical_device(db: Session, device_uuid: UUID4):
    return get_by_uuid(db, models.Medical_Device, device_uuid)


def get_medical_device_by_serial(db: Session, serial: str):
    return db.query(models.Medical_Device).filter_by(serial=serial).first()

def get_medical_device_by_model(db: Session, model: str):
    return db.query(models.Medical_Device).filter_by(model=model).first()

###############################################################################
# /device_maintenance
###############################################################################


def get_maintenances(db: Session):
    return db.query(models.Medical_Device_Maintenance).all()


def get_maintenance(db: Session, maintenance_uuid: UUID4):
    return get_by_uuid(db, models.Medical_Device_Maintenance,
                       maintenance_uuid)


def create_maintenance(db: Session, maintenance: schemas.Maintenance):

    entry = models.Medical_Device_Maintenance(**maintenance.dict())
    db.add(entry)
    db.commit()

    last_maintenance = db.query(models.Medical_Device_Maintenance). \
        order_by(models.Medical_Device_Maintenance.id.desc()).first()

    db.query(models.Medical_Device). \
        filter(models.Medical_Device.uuid == maintenance.device_uuid). \
        update({"last_maintenance_id": last_maintenance.id})
    db.commit()
