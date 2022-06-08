import os
import sys
import yaml

parent_dir = os.path.join(os.path.dirname(__file__), '..')
sys.path.append(parent_dir)

from test_data.test_data import stakeholders
# we import from api instead of db_api for docker setup
from db_api.src.db.session import SessionLocal
from db_api.src import crud, models
from db_api.config.settings import sql_settings

# vault_settings_loader = vault_settings()
# organizations_users_loader = organizations_users()

model_map = {
    'medical': {
        'organization': models.Organization,
        'clinics': models.Clinic,
        'doctors': models.Doctor,
        'doctor_contracts': models.Doctor_Contract,
        'er_duty': models.ER_Duty,
        'patients': models.Patient,
        'group_patients': models.Group_Patient,
        'treatments': models.Treatment,
        'group_treatments': models.Group_Treatment,
        'prescriptions': models.Prescription,
        'group_prescriptions': models.Group_Prescription,
        'diseases': models.Disease,
        'diagnoses': models.Diagnosis,
        'group_diagnoses': models.Group_Diagnosis,
        'diagnostic_tests_data': models.Diagnostic_Test_Data,
        'group_diagnostic_tests_data': models.Group_Diagnostic_Test_Data,
        'technicians': models.Technician,
        'technician_contracts': models.Technician_Contract,
        'medical_devices': models.Medical_Device,
    },
    'manufacturing': {
        'manufacturers': models.Manufacturer,
        'firmware': models.Firmware,
        'device_models': models.Device_Model,
        'devices': models.Manufactured_Device,
        'personnel': models.Personnel,
        'personnel_contracts': models.Personnel_Contract,
        'technicians': models.Technician,
        'technician_contracts': models.Technician_Manufacturing_Contract,
        'incidents': models.Incident,
        'group_incidents': models.Group_Incident
    },
}


def insert_data():
    settings = sql_settings()
    config_file = f"{settings.config_dir}/{settings.databases_yaml}"

    uuid_keys = {}
    with open(config_file) as f:
        categories = yaml.full_load(f)
        for shs in categories.values():
            for stakeholder in shs.values():
                key = {stakeholder['name']: stakeholder['uuid']}
                uuid_keys.update(key)

    for stakeholder in stakeholders:
        name = stakeholder['name']
        kind = stakeholder['type']
        data = stakeholder['data']
        uuid_key = uuid_keys[name]

        db = SessionLocal[uuid_key]()

        for model_name, model in model_map[kind].items():
            for schema in data[model_name]:
                if issubclass(model, models.uuid_model):
                    if crud.get_by_uuid(db=db,
                                        model=model,
                                        uuid=schema.uuid):
                        continue
                elif issubclass(model, models.guid_model):
                    if crud.get_by_uuid(db=db,
                                        model=model,
                                        uuid=schema.guid):
                        continue
                elif issubclass(model, models.id_model):
                    if crud.get_by_id(db=db,
                                      model=model,
                                      id=schema.id):
                        continue
                crud.create(db=db, model=model, schema=schema)
                
                #print(f"Inserted {schema}")
        # maintentance tables needs special care,
        # since it has cross referencing foreign keys
        if kind == 'medical':
            for maintenance in data['maintenances']:
                if crud.get_by_uuid(db=db,
                                    model=models.Medical_Device_Maintenance,
                                    uuid=maintenance.id):
                    continue
                crud.create_maintenance(db=db, maintenance=maintenance)


if __name__ == "__main__":
    insert_data()
