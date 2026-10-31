import hashlib
import secrets
from typing import Optional, Tuple
from app.extensions import token_serializer

# Unambiguous alphabet: excludes 0, O, 1, I to avoid visual confusion
ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
HEX_ALPHABET = "0123456789ABCDEF"


def generate_room_code(length: int = 8) -> str:
    """Generate an unguessable, human-readable private room code."""
    return "".join(secrets.choice(ALPHABET) for _ in range(length))


def generate_room_id() -> str:
    """Generate a high-entropy internal room ID."""
    return secrets.token_urlsafe(16)


def generate_guest_alias() -> str:
    """Generate an anonymous guest alias, e.g. Guest-4F2A."""
    suffix = "".join(secrets.choice(HEX_ALPHABET) for _ in range(4))
    return f"Guest-{suffix}"


def generate_session_token(session_id: str, alias: str) -> str:
    """Create a signed anonymous session token."""
    if not token_serializer:
        return f"{session_id}.{alias}"
    return token_serializer.dumps({"sid": session_id, "alias": alias})


def verify_session_token(token: str, max_age: int = 3600) -> Optional[Tuple[str, str]]:
    """Verify signed session token and return (session_id, alias) or None."""
    if not token or not token_serializer:
        return None
    try:
        data = token_serializer.loads(token, max_age=max_age)
        return data.get("sid"), data.get("alias")
    except Exception:
        return None


def hash_ip(ip: str, salt: str = "veilo_privacy_salt") -> str:
    """Create a truncated privacy-safe salted hash of an IP address."""
    if not ip:
        return "anonymous"
    return hashlib.sha256((salt + ip).encode("utf-8")).hexdigest()[:12]
