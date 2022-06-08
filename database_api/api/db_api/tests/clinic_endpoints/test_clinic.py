from ..client_setup import schemas, clinic_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key1"}
data = stakeholders[0]['data']


def post_clinic(_url, _headers=headers):
    body = {"uuid": data['clinics'][0].uuid.hex}
    return post(_url, _headers, body)


def test_get_all_clinics():
    url = f'{clinic_url}/clinic'
    expected = data['clinics']

    received = [schemas.Clinic(**v) for v in get(url, headers)]

    assert received == expected


def test_get_clinic():
    url = f'{clinic_url}/clinic'

    expected = data['clinics'][0]

    received = schemas.Clinic(**post_clinic(url))

    assert received == expected


def test_clinic_doctors():
    url = f'{clinic_url}/clinic/doctors'

    expected = data['doctors'][:3]
    received = [schemas.Doctor(**v) for v in post_clinic(url)]

    assert received == expected


def test_clinic_device():
    url = f'{clinic_url}/clinic/devices'

    expected = [data['medical_devices'][0], data['medical_devices'][1]]
    expected[0].last_maintenance_id = 0
    expected[1].last_maintenance_id = 1

    received = [schemas.Medical_Device(**v) for v in post_clinic(url)]

    assert received == expected


def test_clinic_doctor_contracts():
    url = f'{clinic_url}/clinic/doctor_contracts'

    expected = data['doctor_contracts'][:3]

    received = [schemas.Doctor_Contract(**v) for v in post_clinic(url)]

    assert received == expected
