import time
from typing import Dict, List, Optional, Tuple
from app import extensions
from app.utils.room_codes import generate_room_code, generate_room_id

DEFAULT_ROOM_TTL = 1800  # 30 minutes


class RoomManager:
    """Manages chat rooms, member allocations, and private codes."""

    def __init__(self, room_ttl: int = DEFAULT_ROOM_TTL):
        self.room_ttl = room_ttl

    def create_room(self, room_type: str = "stranger", code: Optional[str] = None) -> Tuple[str, Optional[str]]:
        """
        Create a new room record.
        Returns (room_id, room_code).
        """
        room_id = generate_room_id()
        if room_type == "private" and not code:
            code = generate_room_code()

        # Save room metadata
        room_key = f"room:{room_id}"
        extensions.redis_client.hset(
            room_key,
            mapping={
                "type": room_type,
                "created_at": str(time.time()),
                "code": code or "",
            },
        )
        extensions.redis_client.expire(room_key, self.room_ttl)

        # Map code -> room_id if private
        if code:
            code_key = f"code:{code.upper()}"
            extensions.redis_client.set(code_key, room_id, ex=self.room_ttl)

        return room_id, code

    def get_room(self, room_id: str) -> Optional[Dict[str, str]]:
        """Fetch room metadata."""
        if not room_id:
            return None
        data = extensions.redis_client.hgetall(f"room:{room_id}")
        return data if data else None

    def get_room_by_code(self, code: str) -> Optional[str]:
        """Lookup room ID by 8-char uppercase code."""
        if not code:
            return None
        return extensions.redis_client.get(f"code:{code.upper()}")

    def add_member(self, room_id: str, sid: str, alias: str, session_id: str = "") -> bool:
        """
        Add member to room. Enforces 2-participant maximum per room.
        Returns True if successfully joined, False if full or room missing.
        """
        if not self.get_room(room_id):
            return False

        members_key = f"room:{room_id}:members"
        current_members = extensions.redis_client.smembers(members_key)
        if len(current_members) >= 2 and sid not in current_members:
            return False

        # Add member to set
        extensions.redis_client.sadd(members_key, sid)
        extensions.redis_client.expire(members_key, self.room_ttl)

        # Store session mapping for SID
        sid_key = f"sid:{sid}"
        extensions.redis_client.hset(
            sid_key,
            mapping={
                "room_id": room_id,
                "alias": alias,
                "session_id": session_id,
            },
        )
        extensions.redis_client.expire(sid_key, self.room_ttl)
        return True

    def get_room_for_sid(self, sid: str) -> Optional[str]:
        """Server-side lookup of room assigned to socket ID."""
        if not sid:
            return None
        return extensions.redis_client.hget(f"sid:{sid}", "room_id")

    def get_session_for_sid(self, sid: str) -> Optional[Dict[str, str]]:
        """Fetch alias, room_id, session_id for a given socket ID."""
        if not sid:
            return None
        data = extensions.redis_client.hgetall(f"sid:{sid}")
        return data if data else None

    def get_room_members(self, room_id: str) -> List[str]:
        """Get all socket IDs in a room."""
        if not room_id:
            return []
        members = extensions.redis_client.smembers(f"room:{room_id}:members")
        return list(members)

    def get_partner_sid(self, room_id: str, sid: str) -> Optional[str]:
        """Find the partner's socket ID in the room."""
        members = self.get_room_members(room_id)
        for member_sid in members:
            if member_sid != sid:
                return member_sid
        return None

    def remove_member(self, sid: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Remove socket from its room.
        Returns (room_id, partner_sid) if the user was in a room.
        """
        room_id = self.get_room_for_sid(sid)
        if not room_id:
            extensions.redis_client.delete(f"sid:{sid}")
            return None, None

        partner_sid = self.get_partner_sid(room_id, sid)

        # Remove from members set and delete sid record
        extensions.redis_client.srem(f"room:{room_id}:members", sid)
        extensions.redis_client.delete(f"sid:{sid}")

        return room_id, partner_sid

    def destroy_room(self, room_id: str):
        """Clean up all Redis keys associated with a room."""
        if not room_id:
            return
        room_data = self.get_room(room_id)
        code = room_data.get("code") if room_data else None

        members = self.get_room_members(room_id)
        keys_to_delete = [f"room:{room_id}", f"room:{room_id}:members"]
        for sid in members:
            keys_to_delete.append(f"sid:{sid}")
        if code:
            keys_to_delete.append(f"code:{code.upper()}")

        extensions.redis_client.delete(*keys_to_delete)


# Singleton manager
room_manager = RoomManager()
