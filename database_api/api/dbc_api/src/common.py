from time import sleep
from fastapi.exceptions import HTTPException
from starlette.status import HTTP_400_BAD_REQUEST
import requests
import yaml
import enum
import json

from ..config.settings import api_key_settings, data_type, db_api_settings, acceptable_data_ids_check
from ..config.settings import stakeholder_settings, endpoint_settings
from .routers.common import server_api_settings

acceptable_types = acceptable_data_ids_check()
host_config = db_api_settings()
stakeholders_config = stakeholder_settings()
api_key_config = api_key_settings()
endpoint_config = endpoint_settings()
settings = server_api_settings()

base_url = f"https://{host_config.db_api_host}:{host_config.db_api_host_port}"

hostname = host_config.db_api_hostname

class stakeholder_category(str, enum.Enum):

    medical = 'medical'
    manufacturing = 'manufacturing'


class UnknownStakeholder(Exception):

    def __init__(self, stakeholder):
        self.stakeholder = stakeholder

    def __str__(self):
        return f"{self.stakeholder} is not in the list of stakeholders!"


def get_info():
    r = requests.get(f"{base_url}/info",
                     headers={'HOST': hostname},
                     timeout=1,
                     verify=settings.ssl_cafile)
    if r.status_code == requests.codes.ok:
        return r.json()
    else:
        r.raise_for_status()


def get_base_endpoints():
    print('Will initialize the base endpoints in 10 seconds...')
    sleep(10)
    r = get_info()
    return {'medical': f"{base_url}/{r['medical_api']}",
            'manufacturing': f"{base_url}/{r['manufacturing_api']}"}


def get_api_keys():
    api_keys = json.load(open(api_key_config.api_keys))

    return api_keys


def get_stakeholders(category: stakeholder_category):
    filename = f"{stakeholders_config.config_dir}/{stakeholders_config.stakeholders_yaml}"

    with open(filename) as f:
        categories = yaml.full_load(f)

    return categories[category].values()


def check_acceptable_data_type(data_type: data_type):
    acceptable_ids = acceptable_types.acceptable_data_ids
    if data_type not in acceptable_ids:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="ERROR IN REQUEST TYPE - UNKNOWN TYPE",
            )
    return