from functools import lru_cache
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from railniyojan.api.railradar_client import RailRadarClient, RailRadarError
from railniyojan.api.settings import get_settings

router = APIRouter(prefix="/railradar", tags=["railradar"])


@lru_cache
def _client() -> RailRadarClient:
    return RailRadarClient(get_settings())


async def _fetch(path: str, params: dict[str, str] | None = None) -> dict[str, Any]:
    client = _client()
    try:
        return await client.get(path, params)
    except RailRadarError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.get("/trains/{train_number}/timetable")
async def timetable(
    train_number: str,
    halts_only: bool = Query(False),
) -> dict:
    if not train_number.isdigit() or len(train_number) != 5:
        raise HTTPException(status_code=422, detail="train_number must be a 5-digit number")
    return await _fetch(f"/trains/{train_number}", {"haltsOnly": str(halts_only).lower()})


@router.get("/trains/{train_number}/route")
async def route(
    train_number: str,
    geometry_format: str = Query("geojson", alias="format"),
    stops: bool = Query(False),
) -> dict:
    if not train_number.isdigit() or len(train_number) != 5:
        raise HTTPException(status_code=422, detail="train_number must be a 5-digit number")
    if geometry_format not in {"geojson", "polyline", "coordinates"}:
        raise HTTPException(
            status_code=422, detail="format must be geojson, polyline, or coordinates"
        )
    return await _fetch(
        f"/trains/{train_number}/route",
        {"format": geometry_format, "stops": str(stops).lower()},
    )


@router.get("/trains/{train_number}/live")
async def live(train_number: str) -> dict:
    if not train_number.isdigit() or len(train_number) != 5:
        raise HTTPException(status_code=422, detail="train_number must be a 5-digit number")
    return await _fetch(f"/trains/{train_number}/live")
