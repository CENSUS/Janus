from ..client_setup import schemas, clinic_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key1"}
data = stakeholders[0]['data']


def post_disease(_url, _headers=headers):
    body = {"uuid": data['diseases'][0].uuid.hex}
    return post(_url, _headers, body)


def test_get_all_diseases():
    url = f'{clinic_url}/disease'

    expected = data['diseases']

    received = [schemas.Disease(**v) for v in get(url, headers)]

    assert received == expected


def test_get_disease():
    url = f'{clinic_url}/disease'

    expected = data['diseases'][0]

    received = schemas.Disease(**post_disease(url))

    assert received == expected
