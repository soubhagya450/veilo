import hashlib
import time
from typing import Optional
from app import extensions

SPAM_HISTORY_TTL = 10  # seconds to keep recent message hash
BLOCK_TTL_SECONDS = 7200  # 2 hours
FAILED_CODE_LOCKOUT_SECONDS = 300  # 5 minutes lockout after threshold


def allow(key: str, limit: int, window: int) -> bool:
    """
    Sliding window-bucket rate limiter backed by Redis or InMemoryStore.
    Returns True if action is allowed, False if limit exceeded.
    """
    bucket = f"rl:{key}:{int(time.time() // window)}"
    count = extensions.redis_client.incr(bucket)
    if count == 1:
        extensions.redis_client.expire(bucket, window)
    return count <= limit


def is_ip_banned(ip_hash: str) -> bool:
    """Check if an IP hash is currently locked out."""
    val = extensions.redis_client.get(f"ban:{ip_hash}")
    return val is not None


def record_failed_room_attempt(ip_hash: str) -> bool:
    """
    Track failed room join attempt.
    If 5 failed attempts within 60s, locks out IP hash for 5 minutes.
    Returns True if user is now locked out.
    """
    key = f"rl:failed_join:{ip_hash}"
    count = extensions.redis_client.incr(key)
    if count == 1:
        extensions.redis_client.expire(key, 60)
    if count >= 5:
        extensions.redis_client.set(f"ban:{ip_hash}", "locked", ex=FAILED_CODE_LOCKOUT_SECONDS)
        return True
    return False


def is_duplicate_spam(sid: str, text: str) -> bool:
    """
    Prevent rapid identical duplicate messages from the same socket.
    Returns True if flagged as duplicate spam.
    """
    text_hash = hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()[:16]
    key = f"spam:{sid}:{text_hash}"
    exists = extensions.redis_client.get(key)
    if exists:
        return True
    extensions.redis_client.set(key, "1", ex=SPAM_HISTORY_TTL)
    return False


def block_partner(user_sid: str, partner_sid: str):
    """Register a block between two participants for the session duration."""
    if not user_sid or not partner_sid or user_sid == partner_sid:
        return
    extensions.redis_client.sadd(f"blocked:{user_sid}", partner_sid)
    extensions.redis_client.expire(f"blocked:{user_sid}", BLOCK_TTL_SECONDS)


def is_blocked(sid_a: str, sid_b: str) -> bool:
    """Check if either participant has blocked the other."""
    if not sid_a or not sid_b:
        return False
    blocked_by_a = extensions.redis_client.sismember(f"blocked:{sid_a}", sid_b)
    blocked_by_b = extensions.redis_client.sismember(f"blocked:{sid_b}", sid_a)
    return bool(blocked_by_a or blocked_by_b)


def record_report(reporter_sid: str, reported_sid: str, room_id: str, reason: str):
    """
    Record an anonymous report event without storing message content.
    Automatically blocks the reported user.
    """
    block_partner(reporter_sid, reported_sid)
    # Store aggregated report counter for safety analysis
    if reported_sid:
        report_key = f"reports_against:{reported_sid}"
        count = extensions.redis_client.incr(report_key)
        if count == 1:
            extensions.redis_client.expire(report_key, 3600)
