import requests
from pydantic import BaseModel, UUID4
from pydantic import validate_arguments
from datetime import date
from typing import Optional

from .common import get_api_keys, get_stakeholders
from .common import stakeholder_category, hostname
from .routers.common import server_api_settings

settings = server_api_settings()

class PatientModel(BaseModel):

    uuid: Optional[UUID4]
    SSN: Optional[str]
    firstname: Optional[str]
    surname: Optional[str]
    date_of_birth: Optional[date]


@validate_arguments
def get_patient_history(endpoint: str, payload: PatientModel):

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
