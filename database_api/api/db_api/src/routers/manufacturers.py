from fastapi import APIRouter, Depends, Body, HTTPException
from pydantic import UUID4
from sqlalchemy.orm import Session
from typing import Dict, List

from .common import get_db
from ...src import crud
from .. import schemas

router = APIRouter()


@router.get("/", response_model=schemas.Manufacturer)
async def get_manufacturer(db: Session = Depends(get_db)):
    return crud.get_manufacturer(db)

###############################################################################
# /firmware
###############################################################################


@router.get("/firmware", response_model=List[schemas.Firmware])
async def get_all_firmware(db: Session = Depends(get_db)):
    return crud.get_firmwares(db)


@router.post("/firmware", response_model=schemas.Firmware)
async def get_firmware(uuid: UUID4 = Body(..., embed=True),
                       db: Session = Depends(get_db)):
    return crud.get_firmware(db, uuid)


@router.post("/firmware/upload", response_model=schemas.Firmware)
async def upload_firmware(firmware: schemas.Firmware, db=Depends(get_db)):
    if firmware.uuid:
        db_firmware = await get_firmware(uuid=firmware.uuid, db=db)
        if db_firmware is not None:
            raise HTTPException(
                status_code=400, detail="Firmware uuid already exists")
    return crud.create_firmware(db, firmware)


###############################################################################
# /device_model
###############################################################################


@router.get("/device_model", response_model=List[schemas.Device_Model])
async def get_all_models(db: Session = Depends(get_db)):
    return crud.get_models(db)


@router.post("/device_model", response_model=schemas.Device_Model)
async def get_model(uuid: UUID4 = Body(..., embed=True),
                    db: Session = Depends(get_db)):
    return crud.get_model(db, uuid)


###############################################################################
# /technician
###############################################################################


@router.get("/technician", response_model=List[schemas.Technician])
async def get_all_technicians(db: Session = Depends(get_db)):
    return crud.get_manufacturing_technicians(db)


@router.post("/technician", response_model=schemas.Technician)
async def get_technician(guid: UUID4 = Body(..., embed=True),
                         db: Session = Depends(get_db)):
    return crud.get_manufacturing_technician(db, guid)


@router.get("/technician/contracts",
            response_model=List[schemas.Technician_Contract])
async def get_technician_contracts(db: Session = Depends(get_db)):
    technicians = await get_all_technicians(db=db)
    if not technicians:
        return None

    contracts = [v for technician in technicians
                 for v in crud.get_manufacturing_technician_active_contracts(
                     db, technician.guid)]
    return contracts


@router.post("/technician/contracts",
             response_model=List[schemas.Technician_Contract])
async def get_technician_contract(guid: UUID4 = Body(..., embed=True),
                                  db: Session = Depends(get_db)):
    return crud.get_manufacturing_technician_active_contracts(db, guid)


@router.get("/technician/contracts/all",
            response_model=List[schemas.Technician_Contract])
async def get_technician_contracts_all(db: Session = Depends(get_db)):
    technicians = await get_all_technicians(db=db)
    if not technicians:
        return None

    contracts = [v for technician in technicians for v in technician.contracts]
    return contracts


@router.post("/technician/contracts/all",
             response_model=List[schemas.Technician_Contract])
async def get_technician_contract_all(guid: UUID4 = Body(..., embed=True),
                                      db: Session = Depends(get_db)):
    technician = await get_technician(guid=guid, db=db)
    if not technician:
        return None

    return technician.contracts

###############################################################################
# /personnel
###############################################################################


@router.get("/personnel", response_model=List[schemas.Personnel])
async def get_all_personnel(db: Session = Depends(get_db)):
    return crud.get_all_personnel(db)


@router.post("/personnel", response_model=schemas.Personnel)
async def get_personnel(guid: UUID4 = Body(..., embed=True),
                        db: Session = Depends(get_db)):
    return crud.get_personnel(db, guid)


@router.get("/personnel/contracts",
            response_model=List[schemas.Personnel_Contract])
async def get_all_personnel_contracts(db: Session = Depends(get_db)):
    personnel = await get_all_personnel(db=db)
    if not personnel:
        return None

    contracts = [v for person in personnel
                 for v in crud.get_personnel_active_contracts(db, person.guid)]
    return contracts


@router.post("/personnel/contracts",
             response_model=List[schemas.Personnel_Contract])
async def get_personnel_contracts(guid: UUID4 = Body(..., embed=True),
                                  db: Session = Depends(get_db)):
    personnel = await get_personnel(guid=guid, db=db)
    if not personnel:
        return None

    return personnel.contracts


@router.get("/personnel/contracts/all",
            response_model=List[schemas.Personnel_Contract])
async def get_all_personnel_contracts_all(db: Session = Depends(get_db)):
    personnel = await get_all_personnel(db=db)
    if not personnel:
        return None

    contracts = [v for person in personnel for v in person.contracts]
    return contracts


@router.post("/personnel/contracts/all",
             response_model=List[schemas.Personnel_Contract])
async def get_personnel_contracts_all(guid: UUID4 = Body(..., embed=True),
                                      db: Session = Depends(get_db)):
    personnel = await get_personnel(guid=guid, db=db)
    if not personnel:
        return None

    return personnel.contracts


###############################################################################
# /device
###############################################################################


@router.get("/device", response_model=List[schemas.Manufactured_Device])
async def get_all_devices(db: Session = Depends(get_db)):
    return crud.get_devices(db)


@router.post("/device", response_model=schemas.Manufactured_Device)
async def get_device(device: schemas.DeviceRequest,
                     db: Session = Depends(get_db)):
    if device.uuid:
        return crud.get_device(db, device.uuid)
    elif device.serial:
        return crud.get_device_by_serial(db, device.serial)

    raise HTTPException(
        status_code=400, detail="No Identification field provided.")


@router.get("/device/unpatched_devices",
            response_model=List[schemas.Manufactured_Device])
async def get_unpatched_devices(db: Session = Depends(get_db)):
    return crud.get_unpatched_devices(db)


@router.post("/device/is_firmware_up_to_date", response_model=bool)
async def is_device_patched(device: schemas.DeviceRequest,
                            db: Session = Depends(get_db)):
    _device = await get_device(device=device, db=db)
    if not _device:
        return None

    model = _device.model

    return _device.current_firmware_uuid == model.latest_firmware_available_uuid


@router.get("/device/incidents",
            response_model=List[schemas.Incident])
async def get_all_device_incidents(db: Session = Depends(get_db)):
    return await get_all_incidents(db)


@router.post("/device/incidents",
             response_model=List[schemas.Incident])
async def get_device_incidents(device: schemas.DeviceRequest,
                               db: Session = Depends(get_db)):
    _device = await get_device(device=device, db=db)
    if not _device:
        return None

    return _device.incidents

###############################################################################
# /incident
###############################################################################


@router.get("/incident", response_model=List[schemas.Incident])
async def get_all_incidents(db: Session = Depends(get_db)):
    return crud.get_incidents(db)


@router.post("/incident", response_model=schemas.Incident)
async def get_incident(id: int = Body(..., embed=True),
                       db: Session = Depends(get_db)):
    return crud.get_incident(db, id)


@router.post("/incident/stats/model",
             response_model=schemas.Model_Incident_Stats)
async def get_model_incident_stats(uuid: str = Body(..., embed=True),
                                   db: Session = Depends(get_db)):
                                   
    # _incident = crud.get_model_incidents_stats(db, uuid)
    # incident_model = schemas.Incident.from_orm(_incident)
    # group_incident_model = schemas.Group_Incident.from_orm(_incident.grouped_incident)

    # return {'incidents': {**incident_model.dict(),
    # **group_incident_model.dict()}}

    return crud.get_model_incidents_stats(db, uuid)
