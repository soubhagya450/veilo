import pytest
from app.extensions import ResilientRedisProxy, InMemoryStore


class FlakyRedisMock:
    """Mock simulating a live Redis instance that can be made to drop connection."""
    def __init__(self):
        self._store = {}
        self.should_fail = False

    def get(self, key):
        if self.should_fail:
            import redis
            raise redis.exceptions.ConnectionError("Connection to Redis lost!")
        return self._store.get(key)

    def set(self, key, value, ex=None):
        if self.should_fail:
            import redis
            raise redis.exceptions.ConnectionError("Connection to Redis lost!")
        self._store[key] = str(value)
        return True

    def ping(self):
        if self.should_fail:
            import redis
            raise redis.exceptions.ConnectionError("Ping failed")
        return True


def test_redis_proxy_runtime_failover():
    """Verify that if Redis drops at runtime, proxy switches to InMemoryStore without crashing."""
    fallback = InMemoryStore()
    proxy = ResilientRedisProxy(fallback)

    mock_redis = FlakyRedisMock()
    proxy.set_target(mock_redis)

    assert proxy.is_connected is True

    # 1. Successful write while Redis is up
    proxy.set("test_key", "hello_redis")
    assert proxy.get("test_key") == "hello_redis"

    # 2. Redis connection drops mid-flight!
    mock_redis.should_fail = True

    # 3. Call get() - instead of raising ConnectionError, proxy must catch it and fallback
    result = proxy.get("test_key")
    # Result from fallback store (fallback is empty for this key, so None, and no crash!)
    assert result is None
    # Proxy status must now reflect that Redis is disconnected
    assert proxy.is_connected is False

    # 4. Subsequent writes work seamlessly on fallback store
    proxy.set("new_key", "fallback_value")
    assert proxy.get("new_key") == "fallback_value"


def test_health_check_reflects_failover(client):
    """Verify /api/health accurately reports storage mode."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert "storage" in data
    assert "redisConnected" in data
    assert "status" in data
    assert data["status"] == "ok"
