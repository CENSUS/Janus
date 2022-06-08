from ..client_setup import schemas, clinic_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key1"}
data = stakeholders[0]['data']


def post_device(_url, _headers=headers):
    body = {"uuid": data['medical_devices'][0].uuid.hex}
    return post(_url, _headers, body)


def test_get_all_devices():
    url = f'{clinic_url}/device'

    expected = data['medical_devices']
    for i in range(2):
        expected[i].last_maintenance_id = i

    received = [schemas.Medical_Device(**v) for v in get(url, headers)]

    assert received == expected


def test_get_device():
    url = f'{clinic_url}/device'

    expected = data['medical_devices'][0]

    body = schemas.DeviceRequest(**expected.dict())

    received_uuid = schemas.Medical_Device(
        **post(url, headers, body.json(include={'uuid'})))
    assert received_uuid == expected

    received_serial = schemas.Medical_Device(
        **post(url, headers, body.json(include={'serial'})))
    assert received_serial == expected


def test_get_full_device():
    url = f'{clinic_url}/device/full'

    last_maintenance = data['maintenances'][0]
    clinic = data['clinics'][0]
    device = data['medical_devices'][0]

    expected = schemas.full_Medical_Device(**device.dict(),
                                           last_maintenance=last_maintenance,
                                           clinic=clinic)

    received = schemas.full_Medical_Device(**post_device(url))

    assert received == expected


def test_get_last_device_maintenance():
    url = f'{clinic_url}/device/last_maintenance'

    expected = data['maintenances'][0]

    received = schemas.Maintenance(**post_device(url))

    assert received == expected
