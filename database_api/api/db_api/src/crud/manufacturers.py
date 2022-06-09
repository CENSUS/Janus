from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import UUID4
from datetime import date

from ...src import models, schemas
from .common import get_by_uuid, get_by_id, create


def get_manufacturer(db: Session):
    return db.query(models.Manufacturer).first()


###############################################################################
# /firmware
###############################################################################


def get_firmwares(db: Session):
    return db.query(models.Firmware).all()


def get_firmware(db: Session, firmware_uuid: UUID4):
    return get_by_uuid(db, models.Firmware, firmware_uuid)


def create_firmware(db: Session, firmware: schemas.Firmware):
    create(db=db, model=models.Firmware, schema=firmware, commit=True)


###############################################################################
# /device_model
###############################################################################


def get_models(db: Session):
    return db.query(models.Device_Model).all()


def get_model(db: Session, model_uuid: UUID4):
    return get_by_uuid(db, models.Device_Model, model_uuid)


###############################################################################
# /personnel
###############################################################################

def get_all_personnel(db: Session):
    return db.query(models.Personnel).all()


def get_personnel(db: Session, personnel_uuid: UUID4):
    return get_by_uuid(db, models.Personnel, personnel_uuid)


def get_personnel_active_contracts(db: Session, personnel_uuid: UUID4):
    contracts = db.query(models.Personnel_Contract).filter_by(
        personnel_uuid=personnel_uuid).filter(
        or_(models.Doctor_Contract.end_date >= date.today(),
            models.Doctor_Contract.end_date == None)).all()
    return contracts

###############################################################################
# /device
###############################################################################


def get_devices(db: Session):
    return db.query(models.Manufactured_Device).all()


def get_device(db: Session, device_uuid: UUID4):
    return get_by_uuid(db, models.Manufactured_Device, device_uuid)


def get_unpatched_devices(db: Session):
    unpatched_devices = db.query(models.Manufactured_Device).join(
        models.Device_Model).filter(
        models.Manufactured_Device.current_firmware_uuid ==
        models.Device_Model.latest_firmware_available_uuid
    ).all()

    return unpatched_devices


def get_device_by_serial(db: Session, serial: str):
    return db.query(models.Manufactured_Device). \
        filter_by(serial=serial).first()


###############################################################################
# /technician
###############################################################################


def get_manufacturing_technicians(db: Session):
    return db.query(models.Manufacturing_Technician).all()


def get_manufacturing_technician(db: Session, technician_guid: UUID4):
    return get_by_uuid(db, models.Manufacturing_Technician, technician_guid)


def get_manufacturing_technician_active_contracts(db: Session,
                                                  technician_guid: UUID4):
    contracts = db.query(models.Technician_Manufacturing_Contract).filter_by(
        technician_guid=technician_guid).filter(
        or_(models.Technician_Manufacturing_Contract.end_date >= date.today(),
            models.Technician_Manufacturing_Contract.end_date == None)).all()
    return contracts


###############################################################################
# /incident
###############################################################################


def get_incidents(db: Session):
    return db.query(models.Incident).all()


def get_incident(db: Session, incident_id: int):
    return get_by_id(db, models.Incident, incident_id)

def get_model_incidents_reports(db: Session, model_uuid: UUID4):

    model_query = db.query(models.Manufactured_Device).filter_by(
        device_model_uuid=model_uuid)
    incidents_query = model_query.join(
            models.Incident)
    distinct_incidents_query = incidents_query.group_by(models.Manufactured_Device.uuid)

    total_devices = model_query.count()
    if not total_devices:
        return None
    total_model_incidents = incidents_query.count()

    distinct_model_incidents = distinct_incidents_query.count()

    distinct_incidents_reports = distinct_incidents_query.all()

    response_incidents = []

    for report in (distinct_incidents_reports):
        incidents = report.incidents

        for incident in incidents:
            grouped_incident = incident.grouped_incident

            incident_response = {
                'incident_id': incident.id,
                'device_serial': incident.device_serial,
                'time': incident.time,
                'report_path': grouped_incident.report_path,
                'description': grouped_incident.description,
                'wrapped_encryption_key': grouped_incident.wrapped_encryption_key
            }
            response_incidents.append(incident_response)

    return {'total_devices': total_devices,
            'total_model_incidents': total_model_incidents,
            'distinct_model_incidents': distinct_model_incidents,
            'incident_reports': response_incidents
        }


def get_model_incidents_stats(db: Session, model_uuid: UUID4):

    total_devices = db.query(models.Manufactured_Device).filter_by(
        device_model_uuid=model_uuid).count()
    if not total_devices:
        return None
    total_model_incidents = db.query(models.Manufactured_Device).filter_by(
        device_model_uuid=model_uuid).join(
            models.Incident).count()

    distinct_model_incidents = db.query(models.Manufactured_Device).filter_by(
        device_model_uuid=model_uuid).join(
            models.Incident).group_by(models.Manufactured_Device.uuid).count()

    return {'total_devices': total_devices,
            'total_model_incidents': total_model_incidents,
            'distinct_model_incidents': distinct_model_incidents}

