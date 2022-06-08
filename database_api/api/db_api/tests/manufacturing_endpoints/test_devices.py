from ..client_setup import schemas, manufacturer_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key3"}
data = stakeholders[2]['data']


def post_device(_url, _headers=headers):
    body = {"uuid": data['devices'][0].uuid.hex}
    return post(_url, _headers, body)


def test_get_all_devices():
    url = f'{manufacturer_url}/device'

    expected = data['devices']

    received = [schemas.Manufactured_Device(**v) for v in get(url, headers)]

    assert received == expected


def test_get_device():
    url = f'{manufacturer_url}/device'

    expected = data['devices'][0]

    body = schemas.DeviceRequest(**expected.dict())

    received_uuid = schemas.Manufactured_Device(
        **post(url, headers, body.json(include={'uuid'})))
    assert received_uuid == expected

    received_serial = schemas.Manufactured_Device(
        **post(url, headers, body.json(include={'serial'})))
    assert received_serial == expected


def test_get_all_device_incidents():
    url = f'{manufacturer_url}/device/incidents'

    expected = data['incidents']

    received = [schemas.Incident(**v) for v in get(url, headers)]

    assert received == expected


def test_get_device_incidents():
    url = f'{manufacturer_url}/device/incidents'

    expected = [data['incidents'][0]]

    received = [schemas.Incident(**v) for v in post_device(url)]

    assert received == expected
