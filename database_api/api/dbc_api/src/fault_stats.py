import requests
from pydantic import BaseModel, UUID4, validate_arguments

from .common import get_api_keys, get_stakeholders
from .common import stakeholder_category, hostname
from .common import UnknownStakeholder
from .routers.common import server_api_settings

settings = server_api_settings()

class DeviceModelModel(BaseModel):

    uuid: UUID4


@validate_arguments
def get_fault_stats(endpoint: str, payload: DeviceModelModel,
                    organization: str): # manufacturer was set as UUID - Should investigate

    api_keys = get_api_keys()

    organization = str(organization)

    manufacturing = stakeholder_category.manufacturing
    stakeholders = [stakeholder['uuid']
                    for stakeholder in get_stakeholders(manufacturing)]

    if organization not in stakeholders:
        raise UnknownStakeholder(organization)
    api_key = api_keys[organization]

    r = requests.post(endpoint,
                      headers={'HOST': hostname, 'api_key': api_key},
                      data=payload.json(),
                      timeout=1,
                      verify=settings.ssl_cafile)

    if r.status_code == requests.codes.ok:
        return r.json()
    else:
        r.raise_for_status()
