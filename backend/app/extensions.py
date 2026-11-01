import logging
import threading
import time
from typing import Any, Dict, List, Optional, Set
from flask_socketio import SocketIO
from itsdangerous import URLSafeTimedSerializer

logger = logging.getLogger("veilo")

# Socket.IO instance
socketio = SocketIO(
    cors_allowed_origins="*",
    max_http_buffer_size=10_000,
    ping_interval=20,
    ping_timeout=25,
    async_mode=None,
)


class InMemoryStore:
    """
    Thread-safe in-memory store matching the Redis API needed for Veilo.
    Allows zero-dependency local development and testing while seamlessly
    supporting full Redis in production.
    """

    def __init__(self):
        self._lock = threading.RLock()
        self._strings: Dict[str, Any] = {}
        self._sets: Dict[str, Set[Any]] = {}
        self._hashes: Dict[str, Dict[str, Any]] = {}
        self._lists: Dict[str, List[Any]] = {}
        self._expiry: Dict[str, float] = {}

    def _purge_if_expired(self, key: str) -> bool:
        if key in self._expiry and time.time() > self._expiry[key]:
            self._delete_key(key)
            return True
        return False

    def _delete_key(self, key: str):
        self._strings.pop(key, None)
        self._sets.pop(key, None)
        self._hashes.pop(key, None)
        self._lists.pop(key, None)
        self._expiry.pop(key, None)

    # String / Value methods
    def get(self, key: str) -> Optional[str]:
        with self._lock:
            if self._purge_if_expired(key):
                return None
            val = self._strings.get(key)
            return str(val) if val is not None else None

    def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        with self._lock:
            self._delete_key(key)
            self._strings[key] = str(value)
            if ex:
                self._expiry[key] = time.time() + ex
            return True

    def delete(self, *keys: str) -> int:
        with self._lock:
            count = 0
            for k in keys:
                if k in self._strings or k in self._sets or k in self._hashes or k in self._lists:
                    self._delete_key(k)
                    count += 1
            return count

    def expire(self, key: str, seconds: int) -> bool:
        with self._lock:
            if self._purge_if_expired(key):
                return False
            if key in self._strings or key in self._sets or key in self._hashes or key in self._lists:
                self._expiry[key] = time.time() + seconds
                return True
            return False

    def incr(self, key: str) -> int:
        with self._lock:
            self._purge_if_expired(key)
            val = int(self._strings.get(key, 0)) + 1
            self._strings[key] = str(val)
            return val

    # Set methods
    def sadd(self, key: str, *members: Any) -> int:
        with self._lock:
            self._purge_if_expired(key)
            if key not in self._sets:
                self._sets[key] = set()
            count = 0
            for m in members:
                str_m = str(m)
                if str_m not in self._sets[key]:
                    self._sets[key].add(str_m)
                    count += 1
            return count

    def srem(self, key: str, *members: Any) -> int:
        with self._lock:
            if self._purge_if_expired(key) or key not in self._sets:
                return 0
            count = 0
            for m in members:
                str_m = str(m)
                if str_m in self._sets[key]:
                    self._sets[key].remove(str_m)
                    count += 1
            if not self._sets[key]:
                self._delete_key(key)
            return count

    def smembers(self, key: str) -> Set[str]:
        with self._lock:
            if self._purge_if_expired(key) or key not in self._sets:
                return set()
            return set(self._sets[key])

    def sismember(self, key: str, member: Any) -> bool:
        with self._lock:
            if self._purge_if_expired(key) or key not in self._sets:
                return False
            return str(member) in self._sets[key]

    def scard(self, key: str) -> int:
        with self._lock:
            if self._purge_if_expired(key) or key not in self._sets:
                return 0
            return len(self._sets[key])

    # Hash methods
    def hset(self, key: str, field: Optional[str] = None, value: Optional[Any] = None, mapping: Optional[Dict[str, Any]] = None, **kwargs) -> int:
        with self._lock:
            self._purge_if_expired(key)
            if key not in self._hashes:
                self._hashes[key] = {}
            target = dict(mapping or {})
            if field is not None and value is not None:
                target[str(field)] = str(value)
            target.update(kwargs)
            count = 0
            for f, v in target.items():
                if f not in self._hashes[key]:
                    count += 1
                self._hashes[key][str(f)] = str(v)
            return count

    def hget(self, key: str, field: str) -> Optional[str]:
        with self._lock:
            if self._purge_if_expired(key) or key not in self._hashes:
                return None
            val = self._hashes[key].get(str(field))
            return str(val) if val is not None else None

    def hgetall(self, key: str) -> Dict[str, str]:
        with self._lock:
            if self._purge_if_expired(key) or key not in self._hashes:
                return {}
            return dict(self._hashes[key])

    def hdel(self, key: str, *fields: str) -> int:
        with self._lock:
            if self._purge_if_expired(key) or key not in self._hashes:
                return 0
            count = 0
            for f in fields:
                if str(f) in self._hashes[key]:
                    del self._hashes[key][str(f)]
                    count += 1
            if not self._hashes[key]:
                self._delete_key(key)
            return count

    # List methods (queue)
    def rpush(self, key: str, *values: Any) -> int:
        with self._lock:
            self._purge_if_expired(key)
            if key not in self._lists:
                self._lists[key] = []
            for v in values:
                self._lists[key].append(str(v))
            return len(self._lists[key])

    def lpop(self, key: str) -> Optional[str]:
        with self._lock:
            if self._purge_if_expired(key) or key not in self._lists:
                return None
            if not self._lists[key]:
                return None
            val = self._lists[key].pop(0)
            if not self._lists[key]:
                self._delete_key(key)
            return val

    def lrem(self, key: str, count: int, value: Any) -> int:
        with self._lock:
            if self._purge_if_expired(key) or key not in self._lists:
                return 0
            str_val = str(value)
            orig_len = len(self._lists[key])
            self._lists[key] = [x for x in self._lists[key] if x != str_val]
            removed = orig_len - len(self._lists[key])
            if not self._lists[key]:
                self._delete_key(key)
            return removed

    def llen(self, key: str) -> int:
        with self._lock:
            if self._purge_if_expired(key) or key not in self._lists:
                return 0
            return len(self._lists[key])

    def lrange(self, key: str, start: int, end: int) -> List[str]:
        with self._lock:
            if self._purge_if_expired(key) or key not in self._lists:
                return []
            if end == -1:
                return list(self._lists[key][start:])
            return list(self._lists[key][start : end + 1])

    def pipeline(self):
        return InMemoryPipeline(self)

    def flushall(self):
        with self._lock:
            self._strings.clear()
            self._sets.clear()
            self._hashes.clear()
            self._lists.clear()
            self._expiry.clear()


class InMemoryPipeline:
    def __init__(self, store: InMemoryStore):
        self._store = store
        self._commands = []

    def delete(self, *keys):
        self._commands.append(("delete", keys))
        return self

    def expire(self, key, seconds):
        self._commands.append(("expire", (key, seconds)))
        return self

    def execute(self):
        results = []
        for cmd, args in self._commands:
            fn = getattr(self._store, cmd)
            results.append(fn(*args))
        self._commands.clear()
        return results


def _is_redis_connection_error(exc: Exception) -> bool:
    """Check if an exception is caused by Redis network or connection drops."""
    exc_type = type(exc).__name__
    if any(k in exc_type for k in ("ConnectionError", "TimeoutError", "BusyLoadingError", "ReadOnlyError", "ClusterDownError")):
        return True
    if isinstance(exc, (ConnectionRefusedError, TimeoutError, OSError)):
        return True
    msg = str(exc).lower()
    if any(term in msg for term in ("connection refused", "connection reset", "closed", "timeout", "unreachable", "forbidden")):
        return True
    return False


class ResilientRedisProxy:
    """
    Transparent fault-tolerant proxy wrapping Redis with automatic zero-downtime
    runtime failover to InMemoryStore if the connection drops, plus self-healing
    background reconnection when Redis recovers.
    """
    def __init__(self, fallback_store: InMemoryStore):
        self._fallback_store = fallback_store
        self._real_redis = None
        self._redis_url = ""
        self._using_real_redis = False
        self._lock = threading.Lock()
        self._reconnecting = False
        self._reconnect_interval = 4.0

    def configure(self, redis_url: str):
        """Configure and attempt initial connection to Redis."""
        self._redis_url = redis_url.strip() if redis_url else ""
        if not self._redis_url:
            with self._lock:
                self._using_real_redis = False
                self._real_redis = None
            logger.info("No REDIS_URL provided. Using built-in thread-safe InMemoryStore.")
            return

        self._connect_redis(initial=True)

    def _connect_redis(self, initial: bool = False) -> bool:
        if not self._redis_url:
            return False
        try:
            import redis
            extra_kwargs = {}
            if self._redis_url.startswith("rediss://"):
                extra_kwargs["ssl_cert_reqs"] = None

            client = redis.from_url(
                self._redis_url,
                decode_responses=True,
                socket_connect_timeout=3,
                socket_timeout=3,
                retry_on_timeout=True,
                health_check_interval=15,
                **extra_kwargs,
            )
            client.ping()
            with self._lock:
                self._real_redis = client
                self._using_real_redis = True
            logger.info("Connected to Redis at %s", self._redis_url.split("@")[-1])
            return True
        except Exception as e:
            if initial:
                logger.warning("Redis initial connection failed (%s). Active storage: InMemoryStore fallback.", e)
            with self._lock:
                self._using_real_redis = False
            self._trigger_background_reconnect()
            return False

    def _switch_to_fallback(self, reason: str = ""):
        """Switch to InMemoryStore immediately on Redis disconnect to prevent downtime."""
        with self._lock:
            was_real = self._using_real_redis
            self._using_real_redis = False
            if was_real:
                logger.warning(
                    "Redis connection dropped at runtime (%s). Switched to InMemoryStore zero-downtime fallback.",
                    reason,
                )
        self._trigger_background_reconnect()

    def _trigger_background_reconnect(self):
        """Spawn background auto-reconnector daemon if not already polling."""
        if not self._redis_url:
            return
        with self._lock:
            if self._reconnecting:
                return
            self._reconnecting = True

        t = threading.Thread(
            target=self._background_reconnector,
            daemon=True,
            name="Veilo-Redis-AutoReconnect",
        )
        t.start()

    def _background_reconnector(self):
        """Poll Redis until connection is restored, then seamlessly resume real Redis."""
        logger.info("Background Redis auto-reconnect worker started.")
        while True:
            time.sleep(self._reconnect_interval)
            try:
                import redis
                extra_kwargs = {}
                if self._redis_url.startswith("rediss://"):
                    extra_kwargs["ssl_cert_reqs"] = None

                client = redis.from_url(
                    self._redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                    retry_on_timeout=True,
                    **extra_kwargs,
                )
                client.ping()
                with self._lock:
                    self._real_redis = client
                    self._using_real_redis = True
                    self._reconnecting = False
                logger.info("Redis connection recovered! Resumed live Redis storage.")
                break
            except Exception:
                continue

    @property
    def is_connected(self) -> bool:
        return self._using_real_redis

    def get_target(self) -> Any:
        return self._real_redis if self._using_real_redis else self._fallback_store

    def set_target(self, target: Any):
        """Allows direct override or test swapping."""
        with self._lock:
            if isinstance(target, InMemoryStore):
                self._fallback_store = target
                self._using_real_redis = False
            else:
                self._real_redis = target
                self._using_real_redis = True

    def __getattr__(self, name: str) -> Any:
        # Transparently wrap method calls with connection-error recovery
        def resilient_method(*args, **kwargs):
            if self._using_real_redis and self._real_redis is not None:
                try:
                    fn = getattr(self._real_redis, name)
                    return fn(*args, **kwargs)
                except Exception as exc:
                    if _is_redis_connection_error(exc):
                        self._switch_to_fallback(reason=str(exc))
                        fallback_fn = getattr(self._fallback_store, name)
                        return fallback_fn(*args, **kwargs)
                    raise
            else:
                fallback_fn = getattr(self._fallback_store, name)
                return fallback_fn(*args, **kwargs)

        return resilient_method


# Global resilient storage proxy
redis_client = ResilientRedisProxy(InMemoryStore())
token_serializer: Optional[URLSafeTimedSerializer] = None


def is_redis_connected() -> bool:
    return redis_client.is_connected


def init_extensions(app):
    """Initialize SocketIO, storage (Redis or InMemory), and Serializer."""
    global token_serializer

    # Setup token serializer
    token_serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])

    # Configure Socket.IO origins
    allowed_origins = app.config.get("CORS_ALLOWED_ORIGINS", "*")
    if isinstance(allowed_origins, list) and len(allowed_origins) == 1 and allowed_origins[0] == "*":
        allowed_origins = "*"
    socketio.init_app(app, cors_allowed_origins=allowed_origins)

    # Initialize storage with fault-tolerant resilient proxy
    redis_url = app.config.get("REDIS_URL", "").strip()
    redis_client.configure(redis_url)
