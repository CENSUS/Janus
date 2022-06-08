import requests
import pytest
from pydantic import validate_arguments
from ..src.check_firmware import check_device_firmware, DeviceModel
from ..src.common import get_base_endpoints
from ..src.common import endpoint_config
from ..src.common import UnknownStakeholder

from . import stakeholders


@pytest.mark.parametrize(
    "device_query", [
        {'uuid': str(stakeholders[2]['data']['devices'][1].uuid)},
        {'serial': stakeholders[2]['data']['devices'][1].serial}
    ]
)
@validate_arguments
def test_firmware_updated_true(device_query: DeviceModel):

    base = get_base_endpoints()
    endpoint = f"{base['manufacturing']}/{endpoint_config.check_firmware}"

    manufacturer = str(stakeholders[2]['data']['manufacturers'][0].uuid)

    expected = True

    received = check_device_firmware(endpoint, device_query, manufacturer)

    assert received == expected


@pytest.mark.parametrize(
    "device_query", [
        {'uuid': str(stakeholders[2]['data']['devices'][0].uuid)},
        {'serial': stakeholders[2]['data']['devices'][0].serial}
    ]
)
def test_firmware_updated_false(device_query: DeviceModel):

    base = get_base_endpoints()
    endpoint = f"{base['manufacturing']}/{endpoint_config.check_firmware}"

    manufacturer = str(stakeholders[2]['data']['manufacturers'][0].uuid)

    expected = False

    received = check_device_firmware(endpoint, device_query, manufacturer)

    assert received == expected


def test_firmware_updated_unknown_manufacturer():

    base = get_base_endpoints()
    endpoint = f"{base['manufacturing']}/{endpoint_config.check_firmware}"

    # medical organization instead of manufacturer
    manufacturer = str(stakeholders[0]['data']['organization'][0].uuid)

    device_query = {
        'serial': stakeholders[2]['data']['devices'][0].serial,
    }

    try:
        received = check_device_firmware(endpoint, device_query, manufacturer)
    except UnknownStakeholder:
        # This is the excpected exception
        return True

        # Cause test to fail if exception is not correct
    assert True == False
