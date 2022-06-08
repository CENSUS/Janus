import pytest
import json
import requests
import os
from pydantic import validate_arguments

from ..src.patient_history import get_patient_history, PatientModel
from ..src.common import get_base_endpoints
from ..src.common import endpoint_config

from . import stakeholders


base = get_base_endpoints()
endpoint = f"{base['medical']}/{endpoint_config.patient_history}"

dir_path = os.path.dirname(os.path.realpath(__file__))


@pytest.mark.parametrize(
    "payload", [
        {'uuid': stakeholders[0]['data']['patients'][0].uuid},
        {'SSN': stakeholders[0]['data']['patients'][0].SSN},
        {
            'firstname': stakeholders[0]['data']['patients'][0].firstname,
            'surname': stakeholders[0]['data']['patients'][0].surname,
            'date_of_birth': stakeholders[0]['data']['patients'][0].date_of_birth,
        }
    ]
)
@validate_arguments
def test_patient_history_distinct(payload: PatientModel):

    with open(f"{dir_path}/history_distinct.json") as json_file:
        expected = json.load(json_file)

    received = get_patient_history(endpoint, payload)

    assert received == expected


@ pytest.mark.parametrize(
    "payload", [
        {'uuid': stakeholders[0]['data']['patients'][2].uuid},
        {'SSN': stakeholders[0]['data']['patients'][2].SSN},
        {
            'firstname': stakeholders[0]['data']['patients'][2].firstname,
            'surname': stakeholders[0]['data']['patients'][2].surname,
            'date_of_birth': stakeholders[0]['data']['patients'][2].date_of_birth,
        }
    ]


)
@ validate_arguments
def test_patient_history_common(payload: PatientModel):

    with open(f"{dir_path}/history_common.json") as json_file:
        expected = json.load(json_file)

    received = get_patient_history(endpoint, payload)

    assert received == expected


@ pytest.mark.parametrize(
    "payload", [
        {},
        {
            'firstname': stakeholders[0]['data']['patients'][2].firstname,
            'date_of_birth': stakeholders[0]['data']['patients'][2].date_of_birth,
        },
        {
            'surname': stakeholders[0]['data']['patients'][2].surname,
            'date_of_birth': stakeholders[0]['data']['patients'][2].date_of_birth,
        },
        {
            'date_of_birth': stakeholders[0]['data']['patients'][2].date_of_birth,
        },
        {
            'firstname': stakeholders[0]['data']['patients'][2].firstname,
            'surname': stakeholders[0]['data']['patients'][2].surname,
        },
        {
            'firstname': stakeholders[0]['data']['patients'][2].firstname,
        },
        {
            'surname': stakeholders[0]['data']['patients'][2].surname,
        },
    ]
)
@ validate_arguments
def test_patient_history_invalid_id(payload: PatientModel):

    try:
        received = get_patient_history(endpoint, payload)
    except requests.exceptions.HTTPError as e:
        assert(e.response.status_code == 400)
        assert(e.response.text ==
               '{"detail":"No Identification field provided."}')
        return
