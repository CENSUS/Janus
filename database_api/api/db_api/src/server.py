from fastapi import FastAPI, Depends
from fastapi.param_functions import Security
from fastapi.responses import RedirectResponse
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
import uvicorn


from .routers import clinics, common, manufacturers
from .routers.common import server_settings, get_settings


app = FastAPI()

# Redirect all http requests to https instead
app.add_middleware(HTTPSRedirectMiddleware)

# Only accept requests with correctly set Host header
settings = get_settings()

app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=[settings.app_name]
)

app.include_router(
    clinics.router,
    prefix=f'/clinic-api-{settings.app_version}',
    tags=['clinics'],
    dependencies=[Security(common.get_api_key)],
    responses={404: {"description": "Not found"}},
)

app.include_router(
    manufacturers.router,
    prefix=f'/manufacturer-api-{settings.app_version}',
    tags=['manufacturers'],
    dependencies=[Security(common.get_api_key)],
    responses={404: {"description": "Not found"}},
)


# @app.get("/info", dependencies=[Depends(common.get_api_key)])
@app.get("/info")
async def info(settings: server_settings = Depends(get_settings)):
    return {"app_name": settings.app_name,
            "app_version": settings.app_version,
            "medical_api": f'clinic-api-{settings.app_version}',
            "manufacturing_api": f'manufacturer-api-{settings.app_version}',
            }


@app.get("/", dependencies=[Depends(common.get_api_key)])
async def root():
    return RedirectResponse("/docs")


def run_server():
    settings = server_settings()

    uvicorn.run(f'{__name__}:app',
                host=settings.host,
                port=settings.port,
                log_level=settings.log_level,
                reload=settings.debug,
                ssl_keyfile=settings.ssl_keyfile,
                ssl_certfile=settings.ssl_certfile,
                ssl_ca_certs=settings.ssl_cafile,
                )


if __name__ == "__main__":
    run_server()
