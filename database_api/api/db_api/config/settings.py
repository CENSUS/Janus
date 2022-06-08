from pydantic import BaseSettings
from typing import Dict, List
import os

dir_path = os.path.dirname(os.path.realpath(__file__))


class server_settings(BaseSettings):

    app_name: str = "db_api"
    app_version: str = 'v0'
    host: str = 'localhost'
    port: int = 8080
    log_level: str = "info"
    debug: bool = False
    ssl_keyfile: str
    ssl_certfile: str
    ssl_cafile: str

    class Config:
        env_file = f"{dir_path}/.env"

class sql_settings(BaseSettings):

    config_dir: str = dir_path
    databases_yaml: str
    autocommit: bool = False
    autoflush: bool = False

    class Config:
        env_file = f"{dir_path}/.env"


class api_settings(BaseSettings):

    api_keys: str
    api_key_name: str = "api_key"

    class Config:
        env_file = f"{dir_path}/.env"

class accessible_key_principals_check(BaseSettings):

    accessible_key_principals: List[str]

    class Config:
        env_file = f"{dir_path}/.env"

class sensitive_key_principals_check(BaseSettings):

    sensitive_key_principals: List[str]

    class Config:
        env_file = f"{dir_path}/.env"


class sensitive_data_tables_check(BaseSettings):

    sensitive_data_tables: List[str]

    class Config:
        env_file = f"{dir_path}/.env"

class organizations_users(BaseSettings):

    organizations_credentials: str

    class Config:
        env_file = f"{dir_path}/.env"

class vault_settings(BaseSettings):

    vault_address: str
    mountpoint: str
    abe_path_based_on_object_type: Dict[str, str]

    class Config:
        env_file = f"{dir_path}/.env"

class encryption_correlation_for_abe(BaseSettings):

    abe_encryption_options: Dict[str, str]

    class Config:
        env_file = f"{dir_path}/.env"

class encryption_foreign_key_selector(BaseSettings):

    encryption_foreign_key_selector: Dict[str, str]

    class Config:
        env_file = f"{dir_path}/.env"