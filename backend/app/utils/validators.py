import re
from typing import Optional

MAX_MESSAGE_LEN = 500
CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
ROOM_CODE_PATTERN = re.compile(r"^[A-Z2-9]{8}$")
ALLOWED_REPORT_REASONS = {"spam", "harassment", "inappropriate", "offensive", "bot", "other"}


def clean_message(value: any) -> Optional[str]:
    """
    Sanitize and validate text message.
    Strips control characters, leading/trailing whitespace, and enforces length bounds.
    Returns cleaned string or None if invalid.
    """
    if not isinstance(value, str):
        return None
    cleaned = CONTROL_CHARS.sub("", value).strip()
    if not cleaned or len(cleaned) > MAX_MESSAGE_LEN:
        return None
    return cleaned


def validate_room_code(code: any) -> bool:
    """Validate 8-character uppercase unambiguous room code."""
    if not isinstance(code, str):
        return False
    return bool(ROOM_CODE_PATTERN.match(code.strip().upper()))


def validate_report_reason(reason: any) -> str:
    """Normalize and validate report reason."""
    if not isinstance(reason, str):
        return "other"
    r = reason.strip().lower()
    return r if r in ALLOWED_REPORT_REASONS else "other"
