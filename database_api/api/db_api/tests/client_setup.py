from fastapi.testclient import TestClient

from ..src.server import app
from ..src.routers.common import get_settings
from ..src import schemas

client = TestClient(app)

settings = get_settings()

clinic_url = f'/clinic-api-{settings.app_version}'
manufacturer_url = f'/manufacturer-api-{settings.app_version}'
