from fastapi import Security, Depends
from fastapi.security.api_key import APIKeyHeader, APIKey
from starlette.exceptions import HTTPException
from starlette.status import HTTP_401_UNAUTHORIZED
import json

from functools import lru_cache

from ..db.session import SessionLocal
from ...config.settings import server_settings, api_settings


@lru_cache()
def get_settings():
    return server_settings()


api_config = api_settings()


async def get_api_key(api_key: APIKey = Security(
        APIKeyHeader(name=api_config.api_key_name, auto_error=True))):
    try:
        return json.load(open(api_config.api_keys))[str(api_key)]
    except KeyError:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )


def get_db(uuid: str = Depends(get_api_key)):
    db = SessionLocal[uuid]()
    try:
        yield db
    finally:
        db.close()
