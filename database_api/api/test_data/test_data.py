import json
import os
import sys
import yaml
import hvac

path_dir = os.path.dirname(__file__)
parent_dir = os.path.join(path_dir, '..')
sys.path.append(parent_dir)

from db_api.src import schemas
from db_api.config.settings import organizations_users, vault_settings
from bin.encrypt_sensitive_data import encryptData
from db_api.config.settings import server_settings

vault_settings_loader = vault_settings()
settings = server_settings()
organizations_users_loader = organizations_users()
orgs_creds=json.load(open(organizations_users_loader.organizations_credentials))

with open(f"{path_dir}/test_data.yaml") as f:
    full_data = yaml.full_load(f)
    stakeholders = []
    for name, data in full_data.items():

        # Authenticate the Stakeholder with Vault
        vaultClient = hvac.Client(url=vault_settings_loader.vault_address, verify=settings.ssl_cafile, cert=(settings.ssl_certfile, settings.ssl_keyfile))
        vault_authenticated  = vaultClient.auth_userpass(username=name, password=orgs_creds[str(name).upper()], mount_point=vault_settings_loader.mountpoint, use_token=True)

        if not vaultClient.is_authenticated:
            print(f"Could not authenticate the stakeholder: {name}")

        vault_token = vault_authenticated['auth']['client_token'] # Derive the Vault token from the response - We do this here in order to avoid unnecessary calls to the Vault login API

        if data['type'] == 'medical':
            organization = [schemas.Organization(uuid=data['uuid'],
                                                 name=data['name'],
                                                 logo_url=data['logo_url'])]

            clinics = [schemas.Clinic(**v) for v in data["clinics"].values()]
            doctors = [schemas.Doctor(**v) for v in data["doctors"].values()]
            doctor_contracts = [schemas.Doctor_Contract(
                **v) for v in data["doctor_contracts"].values()]
            er_duty = [schemas.ER_Duty(**v) for v in data["er_duty"].values()]
            patients = [schemas.Patient(**v)
                        for v in data["patients"].values()]
            group_patients = [schemas.Group_Patient(**v) for v in [encryptData(data=data['patients'][v], vault_token=vault_token, stakeholder_type=data['type'], type='group_patients') for v in data["patients"]]]
            treatments = [schemas.Treatment(**v)
                          for v in data["treatments"].values()]
            group_treatments = [schemas.Group_Treatment(**v) for v in [encryptData(data=data['treatments'][v], vault_token=vault_token, stakeholder_type=data['type'], type='group_treatments') for v in data["treatments"]]]
            prescriptions = [schemas.Prescription(**v)
                             for v in data["prescriptions"].values()]
            group_prescriptions = [schemas.Group_Prescription(**v) for v in [encryptData(data=data['prescriptions'][v], vault_token=vault_token, stakeholder_type=data['type'], type='group_prescriptions') for v in data["prescriptions"]]]
            diseases = [schemas.Disease(**v)
                        for v in data["diseases"].values()]
            diagnoses = [schemas.Diagnosis(**v)
                         for v in data["diagnoses"].values()]
            group_diagnoses = [schemas.Group_Diagnosis(**v) for v in [encryptData(data=data['diagnoses'][v], vault_token=vault_token, stakeholder_type=data['type'], type='group_diagnoses') for v in data["diagnoses"]]]
            diagnostic_tests_data = [schemas.Diagnostic_Test(
                **v) for v in data["diagnostic_tests_data"].values()]
            group_diagnostic_tests_data = [schemas.Group_Diagnostic_Test(**v) for v in [encryptData(data=data['diagnostic_tests_data'][v], vault_token=vault_token, stakeholder_type=data['type'], type='group_diagnostic_tests_data') for v in data["diagnostic_tests_data"]]]
            technicians = [schemas.Technician(
                **v) for v in data["technicians"].values()]
            technician_contracts = [schemas.Technician_Contract(
                **v) for v in data["technician_contracts"].values()]
            medical_devices = [schemas.Medical_Device(**v)
                               for v in data["medical_devices"].values()]
            maintenances = [schemas.Maintenance(**v)
                            for v in data["maintenances"].values()]

            stakeholder_data = {'organization': organization,
                                'clinics': clinics,
                                'doctors': doctors,
                                'doctor_contracts': doctor_contracts,
                                'er_duty': er_duty,
                                'patients': patients,
                                'group_patients': group_patients,
                                'treatments': treatments,
                                'group_treatments': group_treatments,
                                'prescriptions': prescriptions,
                                'group_prescriptions': group_prescriptions,
                                'diseases': diseases,
                                'diagnoses': diagnoses,
                                'group_diagnoses': group_diagnoses,
                                'diagnostic_tests_data': diagnostic_tests_data,
                                'group_diagnostic_tests_data': group_diagnostic_tests_data,
                                'technicians': technicians,
                                'technician_contracts': technician_contracts,
                                'medical_devices': medical_devices,
                                'maintenances': maintenances,
                                }
        else:
            manufacturers = [schemas.Manufacturer(**v)
                             for v in data["manufacturers"].values()]
            firmware = [schemas.Firmware(**v)
                        for v in data["firmware"].values()]
            device_models = [schemas.Device_Model(**v)
                             for v in data["device_models"].values()]
            devices = [schemas.Manufactured_Device(
                **v) for v in data["devices"].values()]
            personnel = [schemas.Personnel(
                **v) for v in data["personnel"].values()]
            personnel_contracts = [schemas.Personnel_Contract(
                **v) for v in data["personnel_contracts"].values()]
            technicians = [schemas.Technician(
                **v) for v in data["technicians"].values()]
            technician_contracts = [schemas.Technician_Contract(
                **v) for v in data["technician_contracts"].values()]
            incidents = [schemas.Incident(
                **v) for v in data["incidents"].values()]
            group_incidents = [schemas.Group_Incident(**v) for v in [encryptData(data=data['incidents'][v], vault_token=vault_token, stakeholder_type=data['type'], type='group_incidents') for v in data["incidents"]]]
            stakeholder_data = {'manufacturers': manufacturers,
                                'firmware': firmware,
                                'device_models': device_models,
                                'devices': devices,
                                'personnel': personnel,
                                'personnel_contracts': personnel_contracts,
                                'technicians': technicians,
                                'technician_contracts': technician_contracts,
                                'incidents': incidents,
                                'group_incidents': group_incidents
                                }

        stakeholders.append(
            {'name': name, 'type': data['type'], 'data': stakeholder_data})
