from functools import lru_cache

from ...config.settings import server_api_settings


@lru_cache()
def get_settings():
    return server_api_settings()
