from ..client_setup import schemas, manufacturer_url
from ..utilities import get
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key3"}
data = stakeholders[2]['data']


def test_get_manufacturer():
    url = manufacturer_url

    expected = data['manufacturers'][0]

    received = schemas.Manufacturer(**get(url, headers))

    assert received == expected
