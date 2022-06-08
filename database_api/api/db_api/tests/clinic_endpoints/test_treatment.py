from ..client_setup import schemas, clinic_url
from ..utilities import post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key1"}
data = stakeholders[0]['data']


def post_treatment(_url, _headers=headers):
    body = {"uuid": data['treatments'][0].uuid.hex}
    return post(_url, _headers, body)


def test_get_treatment():
    url = f'{clinic_url}/treatment'

    expected = data['treatments'][0]

    received = schemas.Treatment(**post_treatment(url))

    assert received == expected


def test_get_full_treatment():

    url = f'{clinic_url}/treatment/full'

    treatment = data['treatments'][0]
    prescriptions = [data['prescriptions'][0]]
    diagnoses = [data['diagnoses'][0]]
    patient = data['patients'][0]
    clinic = data['clinics'][0]
    expected = schemas.full_Treatment(**treatment.dict(),
                                      prescriptions=prescriptions,
                                      diagnoses=diagnoses,
                                      patient=patient,
                                      clinic=clinic)

    received = schemas.full_Treatment(**post_treatment(url))

    assert received == expected


def test_get_treatment_prescriptions():
    url = f'{clinic_url}/treatment/prescriptions'

    expected = [data['prescriptions'][0]]

    received = [schemas.Prescription(**v) for v in post_treatment(url)]

    assert received == expected


def test_get_treatment_diagnoses():
    url = f'{clinic_url}/treatment/diagnoses'

    expected = [data['diagnoses'][0]]

    received = [schemas.Diagnosis(**v) for v in post_treatment(url)]

    assert received == expected
