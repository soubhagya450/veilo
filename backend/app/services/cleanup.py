import logging
from typing import Optional, Tuple
from app import extensions
from app.services.matchmaking import matchmaking
from app.services.room_manager import room_manager

logger = logging.getLogger("veilo")


def destroy_room(room_id: str):
    """Safely destroy an empty or abandoned room and all associated keys."""
    if not room_id:
        return
    try:
        room_manager.destroy_room(room_id)
        logger.debug("Destroyed room %s", room_id[:8])
    except Exception as e:
        logger.error("Error destroying room %s: %s", room_id[:8], e)


def cleanup_socket(sid: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Complete cleanup for a disconnected or leaving socket.
    1. Removes socket from matchmaking queue.
    2. Removes socket from active room.
    3. Returns (room_id, partner_sid) so caller can notify partner and destroy room.
    """
    # Remove from waiting queue if queued
    matchmaking.remove_from_queue(sid)

    # Remove from room
    room_id, partner_sid = room_manager.remove_member(sid)

    if room_id:
        # Check remaining members
        remaining = room_manager.get_room_members(room_id)
        if not remaining:
            destroy_room(room_id)

    # Clean up any lingering socket keys
    extensions.redis_client.delete(f"sid:{sid}")

    return room_id, partner_sid
