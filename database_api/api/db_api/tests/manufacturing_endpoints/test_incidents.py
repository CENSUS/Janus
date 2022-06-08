from ..client_setup import schemas, manufacturer_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key3"}
data = stakeholders[2]['data']


def post_incident(_url, _headers=headers):
    body = {"id": data['incidents'][0].id}
    return post(_url, _headers, body)


def test_get_all_incidents():
    url = f'{manufacturer_url}/incident'

    expected = data['incidents']

    received = [schemas.Incident(**v) for v in get(url, headers)]

    assert received == expected


def test_get_incident():
    url = f'{manufacturer_url}/incident'

    expected = data['incidents'][0]

    received = schemas.Incident(**post_incident(url))

    assert received == expected
