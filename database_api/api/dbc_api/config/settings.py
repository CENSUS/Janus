from pydantic import BaseSettings
from typing import Dict, List
import os

dir_path = os.path.dirname(os.path.realpath(__file__))


class db_api_settings(BaseSettings):

    db_api_host: str = 'localhost'
    db_api_port: str = 5000
    db_api_host_port: int = 5000
    db_api_hostname: str = 'db_api'
    config_dir: str = dir_path

    class Config:
        env_file = f"{dir_path}/.env"


class server_api_settings(BaseSettings):

    app_name: str = "dbc-api"
    app_version: str = 'v0'
    host: str = '0.0.0.0'
    port: int = 5005
    log_level: str = "info"
    debug: bool = True
    ssl_keyfile: str
    ssl_certfile: str
    ssl_cafile: str
    ssl_cert_reqs: int = 1

    class Config:
        env_file = f"{dir_path}/.env"


class stakeholder_settings(BaseSettings):

    config_dir: str = dir_path
    stakeholders_yaml: str

    class Config:
        env_file = f"{dir_path}/.env"


class api_key_settings(BaseSettings):

    api_keys: str
    api_key_name: str = "api_key"

    class Config:
        env_file = f"{dir_path}/.env"


class endpoint_settings(BaseSettings):

    patient_history: str
    check_firmware: str
    fault_statistics: str
    disease_statistics: str
    patient_statistics: str
    device_ownership: str

    class Config:
        env_file = f"{dir_path}/.env"


class acceptable_data_ids_check(BaseSettings):

    acceptable_data_ids: List[str]

    class Config:
        env_file = f"{dir_path}/.env"


class data_type(BaseSettings):

    data_type: str