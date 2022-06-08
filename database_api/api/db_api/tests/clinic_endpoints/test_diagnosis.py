from ..client_setup import schemas, clinic_url
from ..utilities import get, post
from . import stakeholders

headers = {"Host": "db_api", "api_key": "test_api_key1"}
data = stakeholders[0]['data']


def post_diagnosis(_url, _headers=headers):
    body = {"uuid": data['diagnoses'][0].uuid.hex}
    return post(_url, _headers, body)


def test_get_all_diagnoses():
    url = f'{clinic_url}/diagnosis'

    expected = data['diagnoses']

    received = [schemas.Diagnosis(**v) for v in get(url, headers)]

    assert received == expected


def test_get_diagnosis():
    url = f'{clinic_url}/diagnosis'

    expected = data['diagnoses'][0]

    received = schemas.Diagnosis(**post_diagnosis(url))

    assert received == expected


def test_get_full_diagnosis():
    url = f'{clinic_url}/diagnosis/full'

    diagnosis = data['diagnoses'][0]
    tests = [data['diagnostic_tests_data'][1]]
    treatment = data['treatments'][0]
    contract = data['doctor_contracts'][1]
    disease = data['diseases'][0]

    expected = schemas.full_Diagnosis(**diagnosis.dict(),
                                      tests=tests,
                                      treatment=treatment,
                                      contract=contract,
                                      disease=disease)

    received = schemas.full_Diagnosis(**post_diagnosis(url))

    assert received == expected
