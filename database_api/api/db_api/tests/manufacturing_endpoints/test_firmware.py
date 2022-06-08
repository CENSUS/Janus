from ..client_setup import schemas, manufacturer_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key3"}
data = stakeholders[2]['data']


def post_firmware(_url, _headers=headers):
    body = {"uuid": data['firmware'][0].uuid.hex}
    return post(_url, _headers, body)


def test_get_all_firmware():
    url = f'{manufacturer_url}/firmware'

    expected = data['firmware']

    received = [schemas.Firmware(**v) for v in get(url, headers)]

    assert received == expected


def test_get_firmware():
    url = f'{manufacturer_url}/firmware'

    expected = data['firmware'][0]

    received = schemas.Firmware(**post_firmware(url))

    assert received == expected
