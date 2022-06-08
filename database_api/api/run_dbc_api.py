import typer
from dbc_api.src.server import run_server_api


def run_all():
    """
    Start dbc_api server
    """

    print("Step 1. Start Server")
    run_server_api()


if __name__ == "__main__":
    typer.run(run_all)
