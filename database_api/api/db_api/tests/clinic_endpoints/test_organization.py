from ..client_setup import schemas, clinic_url
from ..utilities import get
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key1"}
data = stakeholders[0]['data']


def test_get_organization():
    url = clinic_url

    expected = data['organization'][0]

    received = schemas.Organization(**get(url, headers))

    assert received == expected
