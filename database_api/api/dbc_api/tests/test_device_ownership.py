from ..src.device_ownership import is_device_owned
from ..src.common import get_base_endpoints
from ..src.common import endpoint_config
from ..src.common import UnknownStakeholder

from . import stakeholders


def test_device_owned_true():

    base = get_base_endpoints()
    endpoint = f"{base['medical']}/{endpoint_config.device_ownership}"

    organization = str(stakeholders[0]['data']['organization'][0].uuid)

    stats = {
        'is_owned': True,
        'clinic_name': 'Plainsboro Hospital',
        'clinic_address': 'address for clinic_0',
    }

    stats_query = {
        'serial': stakeholders[0]['data']['medical_devices'][0].serial,
    }

    received = is_device_owned(endpoint, stats_query, organization)

    assert received == stats


def test_device_owned_fale():

    base = get_base_endpoints()
    endpoint = f"{base['medical']}/{endpoint_config.device_ownership}"

    organization = str(stakeholders[0]['data']['organization'][0].uuid)

    stats = {
        'is_owned': False,
    }

    stats_query = {
        'serial': stakeholders[1]['data']['medical_devices'][0].serial,
    }

    received = is_device_owned(endpoint, stats_query, organization)

    assert received == stats


def test_device_owned_unknown_organization():

    base = get_base_endpoints()
    endpoint = f"{base['medical']}/{endpoint_config.fault_statistics}"

    organization = str(stakeholders[0]['data']
                       ['organization'][0].uuid).replace('a', '1')

    stats_query = {
        'serial': stakeholders[0]['data']['medical_devices'][0].serial,
    }

    try:
        received = is_device_owned(endpoint, stats_query, organization)
    except UnknownStakeholder:
        # This is the expected exception
        return True

        # Cause test to fail if exception is not correct
    assert True == False
