from ..client_setup import schemas, clinic_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key1"}
data = stakeholders[0]['data']


def post_test(_url, _headers=headers, idx=0):
    body = {"uuid": data['diagnostic_tests_data'][idx].uuid.hex}
    return post(_url, _headers, body)


def test_get_all_tests():
    url = f'{clinic_url}/diagnostic_test'

    expected = data['diagnostic_tests_data']

    received = [schemas.Diagnostic_Test(**v) for v in get(url, headers)]

    assert received == expected


def test_get_test():
    url = f'{clinic_url}/diagnostic_test'

    expected = data['diagnostic_tests_data'][0]

    received = schemas.Diagnostic_Test(**post_test(url))

    assert received == expected


def test_get_full_test_with_diagnosis():
    url = f'{clinic_url}/diagnostic_test/full'

    test = data['diagnostic_tests_data'][1]
    diagnosis = data['diagnoses'][0]

    expected = schemas.full_Diagnostic_Test(**test.dict(),
                                            diagnosis=diagnosis)

    received = schemas.full_Diagnostic_Test(**post_test(url, idx=1))

    assert received == expected


def test_get_full_test_empty_diagnosis():
    url = f'{clinic_url}/diagnostic_test/full'

    test = data['diagnostic_tests_data'][0]

    expected = schemas.full_Diagnostic_Test(**test.dict())

    received = schemas.full_Diagnostic_Test(**post_test(url))

    assert received == expected
