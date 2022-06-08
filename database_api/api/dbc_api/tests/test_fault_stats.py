import requests
from ..src.fault_stats import get_fault_stats
from ..src.common import get_base_endpoints
from ..src.common import endpoint_config
from ..src.common import UnknownStakeholder

from . import stakeholders


def test_fault_stats_default():

    base = get_base_endpoints()
    endpoint = f"{base['manufacturing']}/{endpoint_config.fault_statistics}"

    stats = {
        'total_devices': 1,
        'distinct_model_incidents': 1,
        'total_model_incidents': 2,
    }

    stats_query = {
        'uuid': str(stakeholders[2]['data']['device_models'][1].uuid),
    }

    manufacturer = stakeholders[2]['data']['manufacturers'][0].uuid

    received = get_fault_stats(endpoint, stats_query, manufacturer)

    assert received == stats


def test_fault_stats_unknown_manufacturer():

    base = get_base_endpoints()
    endpoint = f"{base['manufacturing']}/{endpoint_config.fault_statistics}"

    stats_query = {
        'uuid': str(stakeholders[2]['data']['device_models'][0].uuid),
    }

    # organization uuid instead of manufacturer
    manufacturer = stakeholders[0]['data']['organization'][0].uuid

    try:
        received = get_fault_stats(endpoint, stats_query, manufacturer)
    except UnknownStakeholder:
        # This is the excpected exception
        return True

        # Cause test to fail if exception is not correct
    assert True == False
