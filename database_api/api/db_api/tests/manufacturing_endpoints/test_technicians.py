from ..client_setup import schemas, manufacturer_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key3"}
data = stakeholders[2]['data']


def post_technician(_url, _headers=headers):
    body = {"guid": data['technicians'][0].guid.hex}
    return post(_url, _headers, body)


def test_get_all_technicians():
    url = f'{manufacturer_url}/technician'

    expected = data['technicians']

    received = [schemas.Technician(**v) for v in get(url, headers)]

    assert received == expected


def test_get_technician():
    url = f'{manufacturer_url}/technician'

    expected = data['technicians'][0]
    received = schemas.Technician(**post_technician(url))

    assert received == expected


def test_get_all_technician_contracts():
    url = f'{manufacturer_url}/technician/contracts/all'

    expected = data['technician_contracts']
    expected = [expected[0], expected[2], expected[1]]

    received = [schemas.Technician_Contract(**v) for v in get(url, headers)]

    assert received == expected


def test_get_technician_contracts():
    url = f'{manufacturer_url}/technician/contracts/all'

    expected = [data['technician_contracts'][0],
                data['technician_contracts'][2]]

    received = [schemas.Technician_Contract(**v) for v in post_technician(url)]

    assert received == expected
