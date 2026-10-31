import secrets
import time
from typing import Dict
from app.services.room_manager import room_manager


class MessageService:
    """Builds and formats real-time chat message payloads."""

    def build(self, sid: str, text: str, is_system: bool = False, system_type: str = "") -> Dict:
        """Construct sanitized message payload for broadcast."""
        session_data = room_manager.get_session_for_sid(sid)
        alias = session_data.get("alias", "Anonymous") if session_data else "Anonymous"

        return {
            "id": secrets.token_hex(8),
            "text": text,
            "senderAlias": alias,
            "senderSid": sid,
            "timestamp": int(time.time() * 1000),
            "isSystem": is_system,
            "systemType": system_type,
        }

    def build_system_alert(self, text: str, alert_type: str = "info") -> Dict:
        """Construct a system alert message payload."""
        return {
            "id": secrets.token_hex(8),
            "text": text,
            "senderAlias": "Veilo System",
            "senderSid": "system",
            "timestamp": int(time.time() * 1000),
            "isSystem": True,
            "systemType": alert_type,
        }


message_service = MessageService()
