from ..client_setup import schemas, clinic_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key1"}
data = stakeholders[0]['data']


def post_maintenance(_url, _headers=headers):
    body = {"id": data['maintenances'][0].id}
    return post(_url, _headers, body)


def test_get_all_maintenances():
    url = f'{clinic_url}/device_maintenance'

    expected = data['maintenances']

    received = [schemas.Maintenance(**v) for v in get(url, headers)]

    assert received == expected


def test_get_maintenance():
    url = f'{clinic_url}/device_maintenance'

    expected = data['maintenances'][0]

    received = schemas.Maintenance(**post_maintenance(url))

    assert received == expected


def test_get_full_maintenance():
    url = f'{clinic_url}/device_maintenance/full'

    maintenance = data['maintenances'][0]
    device = data['medical_devices'][0]
    contract = data['technician_contracts'][0]

    expected = schemas.full_Maintenance(**maintenance.dict(),
                                        device=device,
                                        contract=contract)

    received = schemas.full_Maintenance(**post_maintenance(url))

    assert received == expected
