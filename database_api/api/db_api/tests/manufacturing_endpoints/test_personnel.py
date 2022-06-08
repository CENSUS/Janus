from ..client_setup import schemas, manufacturer_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key3"}
data = stakeholders[2]['data']


def post_personnel(_url, _headers=headers):
    body = {"guid": data['personnel'][0].guid.hex}
    return post(_url, _headers, body)


def test_get_all_personnel():
    url = f'{manufacturer_url}/personnel'

    expected = data['personnel']

    received = [schemas.Personnel(**v) for v in get(url, headers)]

    assert received == expected


def test_get_personnel():
    url = f'{manufacturer_url}/personnel'

    expected = data['personnel'][0]
    received = schemas.Personnel(**post_personnel(url))

    assert received == expected


def test_get_all_personnel_contracts():
    url = f'{manufacturer_url}/personnel/contracts/all'

    expected = data['personnel_contracts']

    received = [schemas.Personnel_Contract(**v) for v in get(url, headers)]

    assert received == expected


def test_get_personnel_contracts():
    url = f'{manufacturer_url}/personnel/contracts'

    expected = [data['personnel_contracts'][0]]

    received = [schemas.Personnel_Contract(**v) for v in post_personnel(url)]

    assert received == expected
