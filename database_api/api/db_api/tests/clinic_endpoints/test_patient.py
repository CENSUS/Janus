from ..client_setup import schemas, clinic_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key1"}
data = stakeholders[0]['data']


def post_patient(_url, _headers=headers, ssn=""):
    if not ssn:
        ssn = data['patients'][-1].ssn
    body = {"SSN": ssn}
    return post(_url, _headers, body)


def test_get_all_patients():
    url = f'{clinic_url}/patient'

    expected = data['patients'][:-1]

    received = [schemas.Patient(**v) for v in get(url, headers)]

    assert received == expected


def test_get_patient():
    url = f'{clinic_url}/patient'

    expected = data['patients'][-1]

    body = schemas.PatientRequest(**expected.dict())

    received_ssn = schemas.Patient(
        **post(url, headers, body.json(include={'SSN'})))
    assert received_ssn == expected

    received_uuid = schemas.Patient(
        **post(url, headers, body.json(include={'uuid'})))
    assert received_uuid == expected

    received_name = schemas.Patient(
        **post(url, headers, body.json(include={'firstname',
                                                'surname',
                                                'date_of_birth'})))
    assert received_name == expected


def test_get_patient_treatments():
    url = f'{clinic_url}/patient/treatments'

    expected = [data['treatments'][0], data['treatments'][3]]

    received = [schemas.Treatment(**v) for v in post_patient(url, ssn="SSN_00")]

    assert received == expected


def test_get_patient_prescription():
    url = f'{clinic_url}/patient/prescriptions'

    expected = [data['prescriptions'][0], data['prescriptions'][3]]

    received = [schemas.Prescription(**v)
                for v in post_patient(url, ssn="SSN_00")]

    assert received == expected


def test_get_patient_diagnoses():
    url = f'{clinic_url}/patient/diagnoses'

    expected = [data['diagnoses'][0], data['diagnoses'][3]]

    received = [schemas.Diagnosis(**v) for v in post_patient(url, ssn="SSN_00")]

    assert received == expected
