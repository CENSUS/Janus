import os
import sys
import yaml
import typer
from time import sleep
from sqlalchemy_utils import database_exists, create_database
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.exc import OperationalError

parent_dir = os.path.join(os.path.dirname(__file__), '..')
sys.path.append(parent_dir)

from db_api.src import models


Bases = {
    "medical": models.Hospital_Base,
    "manufacturing": models.Manufacturer_Base,
}


def create(filename: str, keep_existing: bool = True):
    """
    Create databases as specified in FILENAME
    and initialize tables according to schema.

    If a database already exists, we skip it,
    unless --no-keep-existing is set.
    Then we re-create it, droping all the data it had.
    """

    if not keep_existing:
        keep_existing = typer.confirm(
            "Are you sure you wish to delete the databases?")
        if not keep_existing:
            typer.echo('Will delete already existing data')

    with open(filename) as f:
        categories = yaml.full_load(f)

        for category, stakeholders in categories.items():
            for stakeholder in stakeholders.values():
                url = f"{stakeholder['db_engine']}://" \
                    f"{stakeholder['db_user']}:" \
                    f"{stakeholder['db_pass']}@" \
                    f"{stakeholder['db_host']}:" \
                    f"{stakeholder['db_port']}/" \
                    f"{stakeholder['db_name']}"
                while True:
                    try:
                        engine = create_engine(
                            url, pool_pre_ping=True, poolclass=NullPool)
                        if not database_exists(engine.url):
                            create_database(engine.url)
                            Bases[category].metadata.create_all(engine)
                        elif not keep_existing:
                            Bases[category].metadata.drop_all(engine)
                            Bases[category].metadata.create_all(engine)
                        print(f"Database {stakeholder['db_host']}:"
                              f"{stakeholder['db_name']} is ready")
                        break
                    except OperationalError as e:
                        print(e)
                        print(f"waiting for database {stakeholder['db_host']}:"
                              f"{stakeholder['db_name']}")
                        sleep(1)


if __name__ == "__main__":
    typer.run(create)
