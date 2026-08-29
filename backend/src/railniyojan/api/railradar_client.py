from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from threading import RLock
from typing import Any

import httpx

from railniyojan.api.settings import Settings


class RailRadarError(Exception):
    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(message)


@dataclass(frozen=True)
class CachedResponse:
    payload: dict[str, Any]
    fetched_at: datetime


class RailRadarClient:
    def __init__(
        self, settings: Settings, transport: httpx.AsyncBaseTransport | None = None
    ) -> None:
        self._settings = settings
        self._http = httpx.AsyncClient(
            base_url=settings.railradar_base_url.rstrip("/"),
            headers={"Authorization": f"Bearer {settings.railradar_api_key}"},
            timeout=settings.railradar_timeout_seconds,
            transport=transport,
        )
        self._cache: dict[str, CachedResponse] = {}
        self._lock = RLock()

    async def close(self) -> None:
        await self._http.aclose()

    async def get(self, path: str, params: dict[str, str] | None = None) -> dict[str, Any]:
        if not self._settings.railradar_api_key:
            raise RailRadarError(503, "RailRadar integration is not configured")

        now = datetime.now(UTC)
        cache_key = f"{path}?{sorted((params or {}).items())}"
        with self._lock:
            cached = self._cache.get(cache_key)
            if cached and (
                now - cached.fetched_at
            ).total_seconds() < self._settings.railradar_cache_ttl_seconds:
                return self._envelope(cached, from_cache=True, stale=False)

        try:
            response = await self._http.get(path, params=params)
            response.raise_for_status()
            body = response.json()
            if not isinstance(body, dict) or body.get("success") is not True:
                raise RailRadarError(
                    response.status_code, "RailRadar returned an unsuccessful response"
                )
            fetched_at = datetime.now(UTC)
            cached = CachedResponse(payload=body, fetched_at=fetched_at)
            with self._lock:
                self._cache[cache_key] = cached
            return self._envelope(cached, from_cache=False, stale=False)
        except RailRadarError:
            raise
        except (httpx.HTTPError, ValueError) as error:
            with self._lock:
                cached = self._cache.get(cache_key)
            if cached:
                return self._envelope(cached, from_cache=True, stale=True)
            status_code = (
                error.response.status_code if isinstance(error, httpx.HTTPStatusError) else 502
            )
            raise RailRadarError(
                status_code,
                "RailRadar request failed and no cached snapshot is available",
            ) from error

    @staticmethod
    def _envelope(cached: CachedResponse, *, from_cache: bool, stale: bool) -> dict[str, Any]:
        return {
            "source": "PUBLIC",
            "provider": "RailRadar",
            "fetched_at": cached.fetched_at.isoformat(),
            "from_cache": from_cache,
            "stale": stale,
            "data": cached.payload.get("data"),
            "provider_meta": cached.payload.get("meta", {}),
        }
