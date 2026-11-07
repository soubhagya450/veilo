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


def cleanup_socket(sid: str, explicit_leave: bool = False) -> Tuple[Optional[str], Optional[str]]:
    """
    Complete cleanup for a disconnected or leaving socket.
    explicit_leave: True if the user deliberately initiated leave/block/report.
                    False if the socket suddenly dropped (tab close, network drop).
    1. Removes socket from matchmaking queue.
    2. Removes socket from active room.
    3. Manages room destruction based on room type and leave type.
    """
    # Remove from waiting queue if queued
    matchmaking.remove_from_queue(sid)

    # Get room metadata before removing member
    room_id = room_manager.get_room_for_sid(sid)
    room_data = room_manager.get_room(room_id) if room_id else None
    room_type = room_data.get("type", "stranger") if room_data else "stranger"

    # Remove from room
    room_id, partner_sid = room_manager.remove_member(sid)

    if room_id:
        remaining = room_manager.get_room_members(room_id)
        if explicit_leave:
            # Explicit leave: destroy if empty or if private room was abandoned
            if not remaining or room_type == "private":
                destroy_room(room_id)
        else:
            # Sudden disconnect / tab close / network drop
            if room_type == "private":
                # If partner existed, an active chat was terminated: destroy room if empty
                # If host was waiting alone (partner_sid is None), keep code alive for 30m TTL
                if not remaining and partner_sid is not None:
                    destroy_room(room_id)
            else:
                if not remaining:
                    destroy_room(room_id)

    # Clean up lingering socket key
    extensions.redis_client.delete(f"sid:{sid}")

    return room_id, partner_sid
