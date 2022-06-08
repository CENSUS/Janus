import typer
import time

from db_api.src.server import run_server
from bin import create_dbs
from bin import insert_test_data


def run_all(filename: str, keep_existing: bool = True):
    """
    Create + initialize databases.
    Insert test data.
    Start db_api server
    """

    print("Step 1. Create the Databases")
    create_dbs.create(filename, keep_existing)

    print("Step 2. Insert test data")
    insert_test_data.insert_data()

    print("Step 3. Start Server")
    run_server()


if __name__ == "__main__":
    typer.run(run_all)
    