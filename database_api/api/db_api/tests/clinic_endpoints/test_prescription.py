from ..client_setup import schemas, clinic_url
from ..utilities import post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key1"}
data = stakeholders[0]['data']


def post_prescription(_url, _headers=headers):
    body = {"uuid": data['prescriptions'][0].uuid.hex}
    return post(_url, _headers, body)


def test_get_prescription():
    url = f'{clinic_url}/prescription'

    expected = data['prescriptions'][0]

    received = schemas.Prescription(**post_prescription(url))

    assert received == expected
