import requests
from ..src.disease_stats import get_disease_stats
from ..src.common import get_base_endpoints
from ..src.common import endpoint_config

from . import stakeholders


def test_disease_stats_all_orgs_default():

    base = get_base_endpoints()
    endpoint = f"{base['medical']}/{endpoint_config.disease_statistics}"

    stats_0 = {
        'number_of_cases': 2,
        'organization_uuid': str(stakeholders[0]['data']['organization'][0].uuid)

    }
    stats_1 = {
        'number_of_cases': 0,
        'organization_uuid': str(stakeholders[1]['data']['organization'][0].uuid)
    }

    stats_query = {
        'uuid': str(stakeholders[0]['data']['diseases'][0].uuid),
    }

    received = get_disease_stats(endpoint, stats_query)

    assert received == [stats_0, stats_1]


def test_disease_stats_all_orgs_since_date():

    base = get_base_endpoints()
    endpoint = f"{base['medical']}/{endpoint_config.disease_statistics}"

    stats_0 = {
        'number_of_cases': 1,
        'organization_uuid': str(stakeholders[0]['data']['organization'][0].uuid)

    }
    stats_1 = {
        'number_of_cases': 0,
        'organization_uuid': str(stakeholders[1]['data']['organization'][0].uuid)
    }

    stats_query = {
        'uuid': str(stakeholders[0]['data']['diseases'][0].uuid),
        'start_date': '2020-05-01'
    }

    received = get_disease_stats(endpoint, stats_query)

    assert received == [stats_0, stats_1]


def test_disease_stats_all_orgs_date_range():

    base = get_base_endpoints()
    endpoint = f"{base['medical']}/{endpoint_config.disease_statistics}"

    stats_0 = {
        'number_of_cases': 0,
        'organization_uuid': str(stakeholders[0]['data']['organization'][0].uuid)

    }
    stats_1 = {
        'number_of_cases': 0,
        'organization_uuid': str(stakeholders[1]['data']['organization'][0].uuid)
    }

    stats_query = {
        'uuid': str(stakeholders[0]['data']['diseases'][0].uuid),
        'start_date': '2020-05-01',
        'end_date': '2020-09-13'
    }

    received = get_disease_stats(endpoint, stats_query)

    assert received == [stats_0, stats_1]


def test_disease_stats_one_clinic_default():

    base = get_base_endpoints()
    endpoint = f"{base['medical']}/{endpoint_config.disease_statistics}"

    stats = {
        'number_of_cases': 1,
        'organization_uuid': str(stakeholders[0]['data']['organization'][0].uuid)

    }

    stats_query = {
        'uuid': str(stakeholders[0]['data']['diseases'][0].uuid),
        'clinic_uuid': str(stakeholders[0]['data']['clinics'][0].uuid)
    }

    received = get_disease_stats(endpoint, stats_query)

    assert received == [stats]


def test_disease_stats_one_clinic_since_date():

    base = get_base_endpoints()
    endpoint = f"{base['medical']}/{endpoint_config.disease_statistics}"

    stats = {
        'number_of_cases': 1,
        'organization_uuid': str(stakeholders[0]['data']['organization'][0].uuid)
    }

    stats_query = {
        'uuid': str(stakeholders[0]['data']['diseases'][0].uuid),
        'clinic_uuid': str(stakeholders[0]['data']['clinics'][0].uuid),
        'start_date': '2020-02-01'
    }

    received = get_disease_stats(endpoint, stats_query)

    assert received == [stats]


def test_disease_stats_one_clinic_date_range():

    base = get_base_endpoints()
    endpoint = f"{base['medical']}/{endpoint_config.disease_statistics}"

    stats = {
        'number_of_cases': 0,
        'organization_uuid': str(stakeholders[0]['data']['organization'][0].uuid)
    }

    stats_query = {
        'uuid': str(stakeholders[0]['data']['diseases'][0].uuid),
        'clinic_uuid': str(stakeholders[0]['data']['clinics'][0].uuid),
        'start_date': '2020-02-01',
        'end_date': '2020-03-01'
    }

    received = get_disease_stats(endpoint, stats_query)

    assert received == [stats]


def test_disease_stats_unknown_clinic():

    base = get_base_endpoints()
    endpoint = f"{base['medical']}/{endpoint_config.disease_statistics}"

    stats_query = {
        'uuid': str(stakeholders[0]['data']['diseases'][0].uuid),
        'clinic_uuid': str(stakeholders[0]['data']['clinics'][0].uuid).replace('a', 'f'),
    }

    received = get_disease_stats(endpoint, stats_query)

    assert received == []


def test_disease_stats_invalid_date_range():

    base = get_base_endpoints()
    endpoint = f"{base['medical']}/{endpoint_config.disease_statistics}"

    stats_query = {
        'uuid': str(stakeholders[0]['data']['diseases'][0].uuid),
        'clinic_uuid': str(stakeholders[0]['data']['clinics'][0].uuid),
        'start_date': '2020-05-01',
        'end_date': '2019-09-13'
    }

    try:
        received = get_disease_stats(endpoint, stats_query)
    except requests.exceptions.HTTPError as e:
        assert(e.response.status_code == 422)
        return

    # Cause test to fail if exception is not correct
    assert True == False
