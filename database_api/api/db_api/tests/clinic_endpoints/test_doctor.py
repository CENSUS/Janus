from ..client_setup import schemas, clinic_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key1"}
data = stakeholders[0]['data']


def post_doctor(_url, _headers=headers):
    body = {"guid": data['doctors'][0].guid.hex}
    return post(_url, _headers, body)


def test_get_all_doctors():
    url = f'{clinic_url}/doctor'

    expected = data['doctors']

    received = [schemas.Doctor(**v) for v in get(url, headers)]

    assert received == expected


def test_get_doctor():
    url = f'{clinic_url}/doctor'

    expected = data['doctors'][0]
    received = schemas.Doctor(**post_doctor(url))

    assert received == expected


def test_get_full_doctor():
    url = f'{clinic_url}/doctor/full'

    doctor = data['doctors'][0]
    expected = schemas.full_Doctor(**doctor.dict(),
                                   contracts=[data['doctor_contracts'][0]])
    received = schemas.full_Doctor(**post_doctor(url))

    assert received == expected


def test_get_doctor_contracts():
    url = f'{clinic_url}/doctor/contracts'

    expected = [data['doctor_contracts'][0]]
    received = [schemas.Doctor_Contract(**v) for v in post_doctor(url)]

    assert received == expected


def test_get_doctor_er_duties():
    url = f'{clinic_url}/doctor/er_duties'

    expected = data['er_duty'][:2]
    received = [schemas.ER_Duty(**v) for v in post_doctor(url)]

    assert received == expected


def test_get_doctor_prescriptions():
    url = f'{clinic_url}/doctor/prescriptions'

    expected = [data['prescriptions'][0], data['prescriptions'][3]]
    received = [schemas.Prescription(**v) for v in post_doctor(url)]

    assert received == expected


def test_get_doctor_diagnoses():
    url = f'{clinic_url}/doctor/diagnoses'

    expected = [data['diagnoses'][1], data['diagnoses'][3]]
    received = [schemas.Diagnosis(**v) for v in post_doctor(url)]

    assert received == expected
