from logging import debug
import yaml
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import sessionmaker

from ...config.settings import sql_settings


def get_category_shards(filename):
    with open(filename) as f:
        categories = yaml.full_load(f)
        shards = {category: {} for category in categories}
        for category, stakeholders in categories.items():
            for stakeholder in stakeholders.values():
                url = f"{stakeholder['db_engine']}://" \
                    f"{stakeholder['db_user']}:" \
                    f"{stakeholder['db_pass']}@" \
                    f"{stakeholder['db_host']}:" \
                    f"{stakeholder['db_port']}/" \
                    f"{stakeholder['db_name']}"
                engine = create_engine(
                    url, pool_pre_ping=True, poolclass=NullPool)
                shard = {stakeholder['uuid']: engine}
                shards[category].update(shard)
    return shards


if __name__ != '__main__':

    settings = sql_settings()
    config_file = f"{settings.config_dir}/{settings.databases_yaml}"
    shards = get_category_shards(config_file)
    flat_shards = {}
    for shard in shards.values():
        flat_shards.update(**shard)

    SessionLocal = {api_key: sessionmaker(
        autocommit=settings.autocommit,
        autoflush=settings.autoflush, bind=engine)
        for api_key, engine in flat_shards.items()}
