from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from railniyojan.api.errors import ApiError, api_error_handler
from railniyojan.api.routes import datasets, health, planning_runs, railradar, rapidblock
from railniyojan.api.settings import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Decision-support API for the RailNiyojan SIH26027 vertical slice.",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_exception_handler(ApiError, api_error_handler)  # type: ignore[arg-type]
    application.include_router(health.router)
    application.include_router(datasets.router)
    application.include_router(planning_runs.router)
    application.include_router(rapidblock.router)
    application.include_router(railradar.router)
    return application


app = create_app()
