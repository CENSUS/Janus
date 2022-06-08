from typing import Optional
import requests
from pydantic import BaseModel, validate_arguments

from .common import stakeholder_category, hostname
from .routers.common import server_api_settings
from .common import get_api_keys, get_stakeholders

settings = server_api_settings()

class DeviceModel(BaseModel):

    serial: Optional[str]
    model: Optional[str]


@validate_arguments
def is_device_owned(endpoint: str, payload: DeviceModel):

    api_keys = get_api_keys()
    response = []
    medical = stakeholder_category.medical
    for stakeholder in get_stakeholders(medical):
        api_key = api_keys[stakeholder['uuid']]
        r = requests.post(endpoint,
                          headers={'HOST': hostname, 'api_key': api_key},
                          data=payload.json(),
                          timeout=1,
                          verify=settings.ssl_cafile)

        if r.status_code == requests.codes.ok:
            data = r.json()
            if data:
                data['organization_uuid'] = stakeholder['uuid']
                response.append(data)
        else:
            r.raise_for_status()

    return response