
import requests
from pydantic import BaseModel, UUID4, validate_arguments
from typing import Optional
from datetime import date

from .common import get_api_keys, get_stakeholders
from .common import stakeholder_category, hostname
from .routers.common import server_api_settings

settings = server_api_settings()

class PatientStatsModel(BaseModel):

    clinic_uuid: Optional[UUID4]
    start_date: Optional[date] = date.min
    end_date: Optional[date] = date.today()


@validate_arguments
def get_patient_stats(endpoint: str,
                      payload: Optional[PatientStatsModel] = None):

    if not payload:
        payload = PatientStatsModel()
    api_keys = get_api_keys()

    medical = stakeholder_category.medical
    response = []
    for stakeholder in get_stakeholders(medical):
        api_key = api_keys[stakeholder['uuid']]

        r = requests.post(endpoint,
                          headers={'HOST': hostname, 'api_key': api_key},
                          data=payload.json(),
                          timeout=1,
                          verify=settings.ssl_cafile)

        if r.status_code == requests.codes.ok:
            data = r.json()
            if data is not None:
                data['organization_uuid'] = stakeholder['uuid']
                response.append(data)
        else:
            r.raise_for_status()

    return response
