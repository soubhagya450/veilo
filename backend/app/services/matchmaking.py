import json
import time
from typing import Optional, Tuple
from app import extensions
from app.services.moderation import is_blocked
from app.services.room_manager import room_manager

QUEUE_KEY = "queue:waiting"
QUEUE_ENTRY_TTL = 60  # seconds


class MatchmakingService:
    """Handles pairing waiting strangers safely and ephemerally."""

    def add_to_queue(self, sid: str, session_id: str, alias: str):
        """Add socket to waiting queue."""
        # Ensure socket is not already in queue
        self.remove_from_queue(sid)
        entry = json.dumps({
            "sid": sid,
            "session_id": session_id,
            "alias": alias,
            "timestamp": time.time(),
        })
        extensions.redis_client.rpush(QUEUE_KEY, entry)

    def remove_from_queue(self, sid: str):
        """Remove any entries for this socket from the waiting queue."""
        # Scan and filter out entries
        entries = extensions.redis_client.lrange(QUEUE_KEY, 0, -1)
        for raw in entries:
            try:
                data = json.loads(raw)
                if data.get("sid") == sid:
                    extensions.redis_client.lrem(QUEUE_KEY, 0, raw)
            except Exception:
                extensions.redis_client.lrem(QUEUE_KEY, 0, raw)

    def try_match(
        self, sid: str, session_id: str, alias: str
    ) -> Optional[Tuple[str, str, str, str]]:
        """
        Attempt to match with another waiting stranger.
        Returns (room_id, stranger_sid, stranger_alias, user_alias) if matched,
        or None if no partner found (and caller should be queued).
        """
        requeue_entries = []
        matched_stranger = None
        now = time.time()

        while True:
            raw = extensions.redis_client.lpop(QUEUE_KEY)
            if not raw:
                break

            try:
                candidate = json.loads(raw)
            except Exception:
                continue

            cand_sid = candidate.get("sid")
            cand_sess = candidate.get("session_id")
            cand_alias = candidate.get("alias", "Stranger")
            cand_time = candidate.get("timestamp", 0)

            # Check expired queue entry (> 60s)
            if now - cand_time > QUEUE_ENTRY_TTL:
                continue

            # Check self-match
            if cand_sid == sid or (cand_sess and cand_sess == session_id):
                continue

            # Check if either user has blocked the other
            if is_blocked(sid, cand_sid):
                requeue_entries.append(raw)
                continue

            # Check if candidate is still connected or already in a room
            existing_room = room_manager.get_room_for_sid(cand_sid)
            if existing_room:
                continue

            # Valid match found!
            matched_stranger = candidate
            break

        # Put back any non-matching valid candidates we had to skip (e.g. blocked)
        for item in requeue_entries:
            extensions.redis_client.rpush(QUEUE_KEY, item)

        if not matched_stranger:
            return None

        stranger_sid = matched_stranger["sid"]
        stranger_alias = matched_stranger["alias"]
        stranger_sess = matched_stranger.get("session_id", "")

        # Create room and add both members
        room_id, _ = room_manager.create_room(room_type="stranger")
        room_manager.add_member(room_id, stranger_sid, stranger_alias, stranger_sess)
        room_manager.add_member(room_id, sid, alias, session_id)

        return room_id, stranger_sid, stranger_alias, alias


matchmaking = MatchmakingService()
