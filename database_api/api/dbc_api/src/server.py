from fastapi import FastAPI
import uvicorn

from .models.request_models.request_models import RequestData
from .common import check_acceptable_data_type, get_base_endpoints
from .common import endpoint_config

from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

from . import check_firmware, device_ownership, disease_stats, fault_stats, patient_history
from .routers.common import server_api_settings

base = get_base_endpoints()

app = FastAPI()
app.add_middleware(HTTPSRedirectMiddleware)

@app.post("/")
def get_data_id(payload: RequestData):
    data_type = payload.data_type
    parameters = payload.parameters
    organization = payload.organization

    check_acceptable_data_type(data_type)

    if data_type == 'data_00':
        endpoint = f"{base['medical']}/{endpoint_config.patient_history}"
        return patient_history.get_patient_history(endpoint, parameters)

    if data_type == 'data_01':
        endpoint = f"{base['manufacturing']}/{endpoint_config.check_firmware}"
        return check_firmware.check_device_firmware(endpoint, parameters, organization)
    
    if data_type == 'data_02':
        endpoint = f"{base['manufacturing']}/{endpoint_config.fault_statistics}"
        return fault_stats.get_fault_stats(endpoint, parameters, organization)

    if data_type == 'data_03':
        endpoint = f"{base['medical']}/{endpoint_config.disease_statistics}"
        return disease_stats.get_disease_stats(endpoint, parameters)
    
    if data_type == 'data_04':
        endpoint = f"{base['medical']}/{endpoint_config.device_ownership}"
        return device_ownership.is_device_owned(endpoint, parameters)


def run_server_api():
    settings = server_api_settings()

    uvicorn.run(f'{__name__}:app',
                host=settings.host,
                port=settings.port,
                log_level=settings.log_level,
                reload=settings.debug,
                ssl_keyfile=settings.ssl_keyfile,
                ssl_certfile=settings.ssl_certfile,
                ssl_ca_certs=settings.ssl_cafile,
                ssl_cert_reqs=settings.ssl_cert_reqs
                )


if __name__ == "__main__":
    run_server_api()
