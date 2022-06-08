from ..client_setup import schemas, manufacturer_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key3"}
data = stakeholders[2]['data']


def post_model(_url, _headers=headers):
    body = {"uuid": data['device_models'][0].uuid.hex}
    return post(_url, _headers, body)


def test_get_all_models():
    url = f'{manufacturer_url}/device_model'

    expected = data['device_models']

    received = [schemas.Device_Model(**v) for v in get(url, headers)]

    assert received == expected


def test_get_model():
    url = f'{manufacturer_url}/device_model'

    expected = data['device_models'][0]

    received = schemas.Device_Model(**post_model(url))

    assert received == expected
