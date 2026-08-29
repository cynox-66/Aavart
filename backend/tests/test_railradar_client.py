import httpx

from railniyojan.api.railradar_client import RailRadarClient
from railniyojan.api.settings import Settings


def test_railradar_client_adds_provenance_and_uses_cache() -> None:
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        assert request.headers["Authorization"] == "Bearer test-key"
        return httpx.Response(
            200,
            json={
                "success": True,
                "data": {"train": {"number": "12919"}},
                "meta": {"source": "database"},
            },
        )

    async def run() -> None:
        client = RailRadarClient(
            Settings(railradar_api_key="test-key"),
            transport=httpx.MockTransport(handler),
        )
        try:
            first = await client.get("/trains/12919", {"haltsOnly": "false"})
            second = await client.get("/trains/12919", {"haltsOnly": "false"})
        finally:
            await client.close()
        assert calls == 1
        assert first["source"] == "PUBLIC"
        assert first["from_cache"] is False
        assert second["from_cache"] is True
        assert second["data"]["train"]["number"] == "12919"

    import asyncio

    asyncio.run(run())


def test_railradar_client_returns_last_snapshot_on_transport_failure() -> None:
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        if calls == 1:
            return httpx.Response(200, json={"success": True, "data": {"ok": True}})
        raise httpx.ConnectError("offline", request=request)

    async def run() -> None:
        client = RailRadarClient(
            Settings(railradar_api_key="test-key", railradar_cache_ttl_seconds=0),
            transport=httpx.MockTransport(handler),
        )
        try:
            await client.get("/trains/12919")
            fallback = await client.get("/trains/12919")
        finally:
            await client.close()
        assert fallback["from_cache"] is True
        assert fallback["stale"] is True
        assert fallback["data"] == {"ok": True}

    import asyncio

    asyncio.run(run())
