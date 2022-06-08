from ..client_setup import schemas, clinic_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key1"}
data = stakeholders[0]['data']


def post_technician(_url, _headers=headers):
    body = {"guid": data['technicians'][0].guid.hex}
    return post(_url, _headers, body)


def test_get_all_technicians():
    url = f'{clinic_url}/technician'

    expected = data['technicians']

    received = [schemas.Technician(**v) for v in get(url, headers)]

    assert received == expected


def test_get_technician():
    url = f'{clinic_url}/technician'

    expected = data['technicians'][0]
    received = schemas.Technician(**post_technician(url))

    assert received == expected


def test_get_full_technician():
    url = f'{clinic_url}/technician/full'

    technician = data['technicians'][0]
    expected = schemas.full_Technician(
        **technician.dict(),
        contracts=[data['technician_contracts'][0]])

    received = schemas.full_Technician(**post_technician(url))

    assert received == expected


def test_get_all_technician_contracts():
    url = f'{clinic_url}/technician/contracts'

    expected = data['technician_contracts']

    received = [schemas.Technician_Contract(**v) for v in get(url, headers)]

    assert received == expected


def test_get_technician_contracts():
    url = f'{clinic_url}/technician/contracts'

    expected = [data['technician_contracts'][0]]

    received = [schemas.Technician_Contract(**v) for v in post_technician(url)]

    assert received == expected


def test_get_technician_maintenances():
    url = f'{clinic_url}/technician/maintenances'

    expected = [data['maintenances'][0]]

    received = [schemas.Maintenance(**v) for v in post_technician(url)]

    assert received == expected
