import json
from fastapi import APIRouter, Depends, Body, HTTPException
from pydantic import UUID4
from sqlalchemy.orm import Session
from typing import Dict, List

from ...src import crud, models, schemas
from .common import get_db

router = APIRouter()


@router.get("/", response_model=schemas.Organization)
async def get_organization(db: Session = Depends(get_db)):
    return crud.get_organization(db)


###############################################################################
# /clinic
###############################################################################


@router.get("/clinic", response_model=List[schemas.Clinic])
async def get_all_clinics(db: Session = Depends(get_db)):
    return crud.get_clinics(db)


@router.post("/clinic", response_model=schemas.Clinic)
async def get_clinic(uuid: UUID4 = Body(..., embed=True),
                     db: Session = Depends(get_db)):
    return crud.get_clinic(db, uuid)


@router.post("/clinic/doctors", response_model=List[schemas.Doctor])
async def get_clinic_doctors(uuid: UUID4 = Body(..., embed=True),
                             db: Session = Depends(get_db)):
    return crud.get_doctors_from_clinic(db=db, clinic_uuid=uuid)


@router.post("/clinic/devices", response_model=List[schemas.Medical_Device])
async def get_clinic_devices(uuid: UUID4 = Body(..., embed=True),
                             db: Session = Depends(get_db)):
    clinic = await get_clinic(uuid=uuid, db=db)
    return clinic.devices


@router.post("/clinic/doctor_contracts",
             response_model=List[schemas.Doctor_Contract])
async def get_clinic_contracts(uuid: UUID4 = Body(..., embed=True),
                               db: Session = Depends(get_db)):
    clinic = await get_clinic(uuid=uuid, db=db)
    return clinic.contracts


###############################################################################
# /doctor
###############################################################################


@router.get("/doctor", response_model=List[schemas.Doctor])
async def get_all_doctors(db: Session = Depends(get_db)):
    return crud.get_doctors(db)


@router.post("/doctor", response_model=schemas.Doctor)
async def get_doctor(guid: UUID4 = Body(..., embed=True),
                     db: Session = Depends(get_db)):
    return crud.get_doctor(db, guid)


@router.post("/doctor/full", response_model=schemas.full_Doctor)
async def get_full_doctor(guid: UUID4 = Body(..., embed=True),
                          db: Session = Depends(get_db)):
    doctor = await get_doctor(guid=guid, db=db)
    d_model = schemas.Doctor.from_orm(doctor)
    contracts = doctor.contracts.filter_by(role=models.Role.doctor).all()
    full_doctor = schemas.full_Doctor(**d_model.dict(),
                                      contracts=contracts)
    return full_doctor


@router.post("/doctor/contracts", response_model=List[schemas.Doctor_Contract])
async def get_doctor_contracts(guid: UUID4 = Body(..., embed=True),
                               db: Session = Depends(get_db)):
    return crud.get_doctor_active_contracts(db, guid)


@router.post("/doctor/contracts/all",
             response_model=List[schemas.Doctor_Contract])
async def get_doctor_contracts_all(guid: UUID4 = Body(..., embed=True),
                                   db: Session = Depends(get_db)):
    doctor = await get_doctor(guid=guid, db=db)
    return doctor.contracts.filter_by(role=models.Role.doctor).all()


@router.post("/doctor/er_duties", response_model=List[schemas.ER_Duty])
async def get_doctor_er_duty(guid: UUID4 = Body(..., embed=True),
                             db: Session = Depends(get_db)):
    contracts = await get_doctor_contracts(db=db, guid=guid)
    er_duties = [
        duty for contract in contracts for duty in contract.er_duties]
    return er_duties


@router.post("/doctor/prescriptions", response_model=List[schemas.Prescription])
async def get_doctor_prescriptions(guid: UUID4 = Body(..., embed=True),
                                   db: Session = Depends(get_db)):
    contracts = await get_doctor_contracts(db=db, guid=guid)
    prescriptions = [
        v for contract in contracts for v in contract.prescriptions]
    return prescriptions


@router.post("/doctor/diagnoses", response_model=List[schemas.Diagnosis])
async def get_doctor_diagnoses(guid: UUID4 = Body(..., embed=True),
                               db: Session = Depends(get_db)):
    contracts = await get_doctor_contracts(db=db, guid=guid)
    diagnoses = [
        v for contract in contracts for v in contract.diagnoses]
    return diagnoses


###############################################################################
# /researcher
###############################################################################


@router.get("/researcher", response_model=List[schemas.Doctor])
async def get_all_researchers(db: Session = Depends(get_db)):
    return crud.get_researchers(db)


@router.post("/researcher", response_model=schemas.Doctor)
async def get_researcher(guid: UUID4 = Body(..., embed=True),
                         db: Session = Depends(get_db)):
    return crud.get_researcher(db, guid)


@router.post("/researcher/contracts",
             response_model=List[schemas.Doctor_Contract])
async def get_researcher_contracts(guid: UUID4 = Body(..., embed=True),
                                   db: Session = Depends(get_db)):
    return crud.get_researcher_active_contracts(db, guid)


@router.post("/researcher/contracts/all",
             response_model=List[schemas.Doctor_Contract])
async def get_researcher_contracts_all(guid: UUID4 = Body(..., embed=True),
                                       db: Session = Depends(get_db)):
    researcher = await get_researcher(guid=guid, db=db)
    return researcher.contracts.filter_by(role=models.Role.researcher).all()


###############################################################################
# /patient
###############################################################################


@router.get("/patient", response_model=List[schemas.Patient])
async def get_all_patients(db: Session = Depends(get_db)):
    return crud.get_patients(db)


@router.post("/patient", response_model=schemas.PatientAccessible)
async def get_patient(patient: schemas.PatientRequest,
                      db: Session = Depends(get_db)):
    if patient.uuid:
        return crud.get_patient(db, patient.uuid)
    elif patient.SSN:
        return crud.get_patient_by_ssn(db, patient.SSN)
    elif patient.firstname and patient.surname and patient.date_of_birth:
        return crud.get_patient_by_name(db, patient)

    raise HTTPException(
        status_code=400, detail="No Identification field provided.")

# @router.post("/patient/full", response_model=schemas.full_Patient)
# async def get_full_patient(patient: schemas.PatientRequest,
#                            db: Session = Depends(get_db)):
#     _patient = await get_patient(patient=patient, db=db)
#     if not _patient:
#         return
#     patient_model = schemas.Patient.from_orm(_patient)
#     treatments = _patient.treatments

#     prescriptions = [
#         v for treatment in treatments for v in treatment.prescriptions]
#     diagnoses = [
#         v for treatment in treatments for v in treatment.diagnoses]

#     return {**patient_model.dict(),
#             'treatments': treatments,
#             'prescriptions': prescriptions,
#             'diagnoses': diagnoses}

@router.post("/patient/full", response_model=Dict[str, schemas.full_Patient])
async def get_full_patient(patient: schemas.PatientRequest,
                           db: Session = Depends(get_db)):

    _patient = await get_patient(patient=patient, db=db)

    if not _patient:
        return
    patient_accessible_model = schemas.PatientAccessible.from_orm(_patient)
    group_patient_model = schemas.Group_Patient.from_orm(_patient.group_patient)

    treatments = _patient.treatments

    prescriptions = [
        v for treatment in treatments for v in treatment.prescriptions]
    diagnoses = [
        v for treatment in treatments for v in treatment.diagnoses]

    return {'patients': {**patient_accessible_model.dict(),
            **group_patient_model.dict(),
            'treatments': treatments,
            'prescriptions': prescriptions,
            'diagnoses': diagnoses}}

@router.post("/patient/treatments", response_model=List[schemas.TreatmentResponse])
async def get_patient_treatments(patient: schemas.PatientRequest,
                                 db: Session = Depends(get_db)):
    _patient = await get_patient(patient=patient, db=db)
    if not _patient:
        return
    return _patient.treatments


@router.post("/patient/prescriptions", response_model=List[schemas.PrescriptionResponse])
async def get_patient_prescriptions(patient: schemas.PatientRequest,
                                    db: Session = Depends(get_db)):
    treatments = await get_patient_treatments(patient=patient, db=db)
    prescriptions = [
        v for treatment in treatments for v in treatment.prescriptions]
    return prescriptions


@router.post("/patient/diagnoses", response_model=List[schemas.DiagnosisResponse])
async def get_patient_diagnoses(patient: schemas.PatientRequest,
                                db: Session = Depends(get_db)):
    treatments = await get_patient_treatments(patient=patient, db=db)
    diagnoses = [
        v for treatment in treatments for v in treatment.diagnoses]
    return diagnoses


@router.post("/patient/stats",
             response_model=schemas.Patient_Stats)
async def get_patient_stats(patient_request: schemas.PatientStatsRequest,
                            db: Session = Depends(get_db)):
    if (patient_request.end_date and
            patient_request.end_date < patient_request.start_date):
        raise HTTPException(
            status_code=422, detail="Invalid date range provided.")
    return crud.get_patient_stats(db, patient_request)


###############################################################################
# /treatment
###############################################################################

@router.post("/treatment", response_model=schemas.TreatmentResponse)
async def get_treatment(uuid: UUID4 = Body(..., embed=True),
                        db: Session = Depends(get_db)):
    return crud.get_treatment(db, uuid)


@router.post("/treatment/full", response_model=schemas.full_Treatment)
async def get_full_treatment(uuid: UUID4 = Body(..., embed=True),
                             db: Session = Depends(get_db)):
    treatment = await get_treatment(db=db, uuid=uuid)
    t_model = schemas.Treatment.from_orm(treatment)
    full_treatment = schemas.full_Treatment(
        **t_model.dict(),
        prescriptions=treatment.prescriptions,
        diagnoses=treatment.diagnoses,
        patient=treatment.patient,
        clinic=treatment.clinic)

    return full_treatment


@router.post("/treatment/prescriptions",
             response_model=List[schemas.PrescriptionResponse])
async def get_treatment_prescriptions(uuid: UUID4 = Body(..., embed=True),
                                      db: Session = Depends(get_db)):
    treatment = await get_treatment(db=db, uuid=uuid)
    return treatment.prescriptions


@router.post("/treatment/diagnoses", response_model=List[schemas.DiagnosisResponse])
async def get_treatment_diagnoses(uuid: UUID4 = Body(..., embed=True),
                                  db: Session = Depends(get_db)):
    treatment = await get_treatment(db=db, uuid=uuid)
    return treatment.diagnoses


###############################################################################
# /prescription
###############################################################################


@router.post("/prescription",
             response_model=schemas.PrescriptionResponse)
async def get_prescription(uuid: UUID4 = Body(..., embed=True),
                           db: Session = Depends(get_db)):
    return crud.get_prescription(db, uuid)


###############################################################################
# /disease
###############################################################################


@router.get("/disease", response_model=List[schemas.Disease])
async def get_all_diseases(db: Session = Depends(get_db)):
    return crud.get_diseases(db)


@router.post("/disease",
             response_model=schemas.Disease)
async def get_disease(uuid: UUID4 = Body(..., embed=True),
                      db: Session = Depends(get_db)):
    return crud.get_disease(db, uuid)


@router.post("/disease/stats",
             response_model=schemas.Disease_Stats, response_model_exclude_unset=True)
async def get_disease_stats(disease_request: schemas.DiseaseStatsRequest,
                            db: Session = Depends(get_db)):
    if (disease_request.end_date and
            disease_request.end_date < disease_request.start_date):
        raise HTTPException(
            status_code=422, detail="Invalid date range provided.")
    return crud.get_disease_stats(db, disease_request)


###############################################################################
# /diagnosis
###############################################################################


@ router.get("/diagnosis", response_model=List[schemas.DiagnosisResponse])
async def get_all_diagnoses(db: Session = Depends(get_db)):
    return crud.get_diagnoses(db)


@ router.post("/diagnosis", response_model=schemas.DiagnosisResponse)
async def get_diagnosis(uuid: UUID4 = Body(..., embed=True),
                        db: Session = Depends(get_db)):
    return crud.get_diagnosis(db, uuid)


@ router.post("/diagnosis/full", response_model=schemas.full_Diagnosis)
async def get_full_diagnosis(uuid: UUID4 = Body(..., embed=True),
                             db: Session = Depends(get_db)):
    diagnosis = await get_diagnosis(db=db, uuid=uuid)
    d_model = schemas.Diagnosis.from_orm(diagnosis)

    full_diagnosis = schemas.full_Diagnosis(**d_model.dict(),
                                            tests=diagnosis.tests,
                                            treatment=diagnosis.treatment,
                                            contract=diagnosis.contract,
                                            disease=diagnosis.disease)
    return full_diagnosis


###############################################################################
# /diagnostic_tests
###############################################################################


@ router.get("/diagnostic_test", response_model=List[schemas.Diagnostic_TestResponse])
async def get_all_tests(db: Session = Depends(get_db)):
    return crud.get_tests(db)


@ router.post("/diagnostic_test", response_model=schemas.Diagnostic_TestResponse)
async def get_test(uuid: UUID4 = Body(..., embed=True),
                   db: Session = Depends(get_db)):
    return crud.get_test(db, uuid)


@router.post("/diagnostic_test/full",
             response_model=schemas.full_Diagnostic_Test)
async def get_full_test(uuid: UUID4 = Body(..., embed=True),
                        db: Session = Depends(get_db)):
    test = await get_test(uuid=uuid, db=db)
    t_model = schemas.Diagnostic_Test.from_orm(test)
    full_test = schemas.full_Diagnostic_Test(**t_model.dict(),
                                             diagnosis=test.diagnosis)
    return full_test


###############################################################################
# /technician
###############################################################################


@router.get("/technician", response_model=List[schemas.Technician])
async def get_all_technicians(db: Session = Depends(get_db)):
    return crud.get_technicians(db)


@router.post("/technician", response_model=schemas.Technician)
async def get_technician(guid: UUID4 = Body(..., embed=True),
                         db: Session = Depends(get_db)):
    return crud.get_technician(db, guid)


@router.post("/technician/full", response_model=schemas.full_Technician)
async def get_full_technician(guid: UUID4 = Body(..., embed=True),
                              db: Session = Depends(get_db)):
    technician = await get_technician(guid=guid, db=db)
    t_model = schemas.Technician.from_orm(technician)
    full_technician = schemas.full_Technician(**t_model.dict(),
                                              contracts=technician.contracts)
    return full_technician


@router.get("/technician/contracts",
            response_model=List[schemas.Technician_Contract])
async def get_all_technician_contracts(db: Session = Depends(get_db)):
    technicians = await get_all_technicians(db=db)
    contracts = [v for technician in technicians
                 for v in crud.get_technician_active_contracts(
                     db, technician.guid)]
    return contracts


@router.get("/technician/contracts/all",
            response_model=List[schemas.Technician_Contract])
async def get_all_technician_contracts_all(db: Session = Depends(get_db)):
    technicians = await get_all_technicians(db=db)
    contracts = [v for technician in technicians for v in technician.contracts]
    return contracts


@router.post("/technician/contracts",
             response_model=List[schemas.Technician_Contract])
async def get_technician_contracts(guid: UUID4 = Body(..., embed=True),
                                   db: Session = Depends(get_db)):
    return crud.get_technician_active_contracts(db, guid)


@router.post("/technician/contracts/all",
             response_model=List[schemas.Technician_Contract])
async def get_technician_contracts_all(guid: UUID4 = Body(..., embed=True),
                                       db: Session = Depends(get_db)):
    technician = await get_technician(guid=guid, db=db)
    return technician.contracts


@router.post("/technician/maintenances",
             response_model=List[schemas.Maintenance])
async def get_technician_maintenances(guid: UUID4 = Body(..., embed=True),
                                      db: Session = Depends(get_db)):
    contracts = await get_technician_contracts(db=db, guid=guid)
    maintenances = [
        v for contract in contracts for v in contract.maintenances]
    return maintenances


###############################################################################
# /device
###############################################################################


@router.get("/device", response_model=List[schemas.Medical_Device])
async def get_all_medical_devices(db: Session = Depends(get_db)):
    return crud.get_medical_devices(db)


@router.post("/device", response_model=schemas.Medical_Device)
async def get_medical_device(device: schemas.DeviceRequest,
                             db: Session = Depends(get_db)):
    if device.uuid:
        return crud.get_medical_device(db, device.uuid)
    elif device.serial:
        return crud.get_medical_device_by_serial(db, device.serial)

    raise HTTPException(
        status_code=400, detail="No Identification field provided.")


@router.post("/device/is_owned", response_model=schemas.MedicalDevicesOwned,
             response_model_exclude_unset=True)
async def get_medical_device_owned(deviceReq: schemas.DeviceRequest,
                                   db: Session = Depends(get_db)):
    if deviceReq.uuid:
        devices = [crud.get_medical_device_by_serial(db, deviceReq.serial)]
    elif deviceReq.model:
        devices = crud.get_medical_devices_by_model(db, deviceReq.model)

    if not devices:
        return {
            "is_owned": False
        }
    else:
        available_devices = []

        for device in devices:
            device_item = {
                "clinic_name": device.clinic.name,
                "clinic_uuid": device.clinic.uuid,
                "clinic_address": device.clinic.address,
                "device_serial": device.serial,
                "device_manufacturer": device.manufacturer,
            }
            available_devices.append(device_item)

        return {
            "is_owned": True,
            "total_devices": len(devices),
            "devices": available_devices
        }

@router.post("/device/last_maintenance", response_model=schemas.Maintenance)
async def get_medical_device_maintenance(device: schemas.DeviceRequest,
                                         db: Session = Depends(get_db)):
    _device = await get_medical_device(device=device, db=db)
    return _device.last_maintenance


@router.post("/device/full", response_model=schemas.full_Medical_Device)
async def get_full_device(device: schemas.DeviceRequest,
                          db: Session = Depends(get_db)):
    _device = await get_medical_device(device=device, db=db)
    d_model = schemas.Medical_Device.from_orm(_device)

    full_device = schemas.full_Medical_Device(
        **d_model.dict(),
        last_maintenance=_device.last_maintenance,
        clinic=_device.clinic)

    return full_device


###############################################################################
# /device_maintenance
###############################################################################


@ router.get("/device_maintenance",
             response_model=List[schemas.Maintenance])
async def get_maintenances(db: Session = Depends(get_db)):
    return crud.get_maintenances(db)


@ router.post("/device_maintenance", response_model=schemas.Maintenance)
async def get_maintenance(id: int = Body(..., embed=True),
                          db: Session = Depends(get_db)):
    return crud.get_maintenance(db, id)


@ router.post("/device_maintenance/full",
              response_model=schemas.full_Maintenance)
async def get_full_maintenance(id: int = Body(..., embed=True),
                               db: Session = Depends(get_db)):
    maintenance = await get_maintenance(id=id, db=db)
    m_model = schemas.Maintenance.from_orm(maintenance)

    full_maintenace = schemas.full_Maintenance(**m_model.dict(),
                                               contract=maintenance.contract,
                                               device=maintenance.device)
    return full_maintenace
