import logging
import secrets
from flask import current_app, request
from flask_socketio import emit, join_room, leave_room
from app.extensions import socketio, redis_client
from app.services.cleanup import cleanup_socket, destroy_room
from app.services.matchmaking import matchmaking
from app.services.message_service import message_service
from app.services.moderation import (
    allow,
    block_partner,
    is_duplicate_spam,
    is_ip_banned,
    record_failed_room_attempt,
    record_report,
)
from app.services.room_manager import room_manager
from app.utils.room_codes import (
    generate_guest_alias,
    generate_session_token,
    hash_ip,
    verify_session_token,
)
from app.utils.validators import clean_message, validate_report_reason, validate_room_code

logger = logging.getLogger("veilo")


def get_client_ip_hash() -> str:
    """Get anonymized hashed IP of current request."""
    ip = request.headers.get("X-Forwarded-For", request.remote_addr or "")
    if current_app.config.get("TESTING") and not ip:
        ip = f"test_{getattr(request, 'sid', 'mock')}"
    if "," in ip:
        ip = ip.split(",")[0].strip()
    return hash_ip(ip)


def get_socket_session(sid: str) -> dict:
    """Retrieve session data attached to this socket."""
    data = redis_client.hgetall(f"sid_meta:{sid}")
    if data:
        return data
    # Fallback to defaults
    return {"session_id": sid, "alias": "Stranger"}


def set_socket_session(sid: str, session_id: str, alias: str):
    """Store session metadata attached to socket."""
    redis_client.hset(
        f"sid_meta:{sid}",
        mapping={"session_id": session_id, "alias": alias},
    )
    redis_client.expire(f"sid_meta:{sid}", 3600)


@socketio.on("connect")
def handle_connect(auth=None):
    """Client connection handshake with anonymous session assignment."""
    sid = request.sid
    ip_hash = get_client_ip_hash()

    if is_ip_banned(ip_hash):
        logger.warning("Connection rejected for locked IP %s", ip_hash)
        return False

    token = None
    if isinstance(auth, dict):
        token = auth.get("token")

    verified = verify_session_token(token) if token else None
    if verified:
        session_id, alias = verified
    else:
        session_id = secrets.token_urlsafe(12)
        alias = generate_guest_alias()
        token = generate_session_token(session_id, alias)

    set_socket_session(sid, session_id, alias)

    emit("session_ready", {
        "token": token,
        "alias": alias,
        "sessionId": session_id,
    })
    logger.debug("Socket connected: %s as %s", sid[:6], alias)
    return True


@socketio.on("disconnect")
def handle_disconnect():
    """Handle sudden socket disconnect and clean up."""
    sid = request.sid
    room_id = room_manager.get_room_for_sid(sid)
    room_data = room_manager.get_room(room_id) if room_id else None
    room_type = room_data.get("type", "stranger") if room_data else "stranger"

    room_id, partner_sid = cleanup_socket(sid, explicit_leave=False)
    redis_client.delete(f"sid_meta:{sid}")

    if partner_sid:
        if room_type == "private":
            # For private code rooms, notify partner of momentary connection pause,
            # don't declare the conversation permanently ended!
            emit(
                "partner_away",
                {
                    "reason": "paused",
                    "message": "Partner connection paused... waiting to reconnect.",
                },
                to=partner_sid,
            )
        else:
            emit("partner_left", {"reason": "disconnected"}, to=partner_sid)
    logger.debug("Socket disconnected: %s", sid[:6])


@socketio.on("find_stranger")
def handle_find_stranger():
    """Queue socket for random stranger matchmaking."""
    sid = request.sid
    ip_hash = get_client_ip_hash()

    # Rate limit: 10 per 60s per IP
    if not allow(f"find:{ip_hash}", limit=10, window=60):
        emit("error_event", {"code": "RATE_LIMITED", "message": "Searching too frequently. Please wait."})
        return

    # Clean up from any existing room explicitly
    prev_room, prev_partner = cleanup_socket(sid, explicit_leave=True)
    if prev_partner:
        emit("partner_left", {"reason": "skipped"}, to=prev_partner)

    session = get_socket_session(sid)
    session_id = session.get("session_id", sid)
    alias = session.get("alias", "Stranger")

    match = matchmaking.try_match(sid, session_id, alias)
    if match:
        room_id, stranger_sid, stranger_alias, user_alias = match
        join_room(room_id, sid=sid)
        join_room(room_id, sid=stranger_sid)

        emit(
            "matched",
            {
                "roomId": room_id,
                "partnerAlias": stranger_alias,
                "yourAlias": user_alias,
                "roomType": "stranger",
            },
            to=sid,
        )
        emit(
            "matched",
            {
                "roomId": room_id,
                "partnerAlias": user_alias,
                "yourAlias": stranger_alias,
                "roomType": "stranger",
            },
            to=stranger_sid,
        )
    else:
        matchmaking.add_to_queue(sid, session_id, alias)
        emit("searching", {"status": "searching", "message": "Looking for a stranger..."})


@socketio.on("cancel_search")
def handle_cancel_search():
    """Cancel waiting in the stranger matchmaking queue."""
    sid = request.sid
    matchmaking.remove_from_queue(sid)
    emit("search_cancelled", {"status": "cancelled"})


@socketio.on("create_room")
def handle_create_room():
    """Create a private room and issue an 8-character room code."""
    sid = request.sid
    ip_hash = get_client_ip_hash()

    # Rate limit: 10 per 10m per IP
    if not allow(f"create_room:{ip_hash}", limit=10, window=600):
        emit("error_event", {"code": "RATE_LIMITED", "message": "Room creation limit reached. Please wait."})
        return

    # Clean up any active room explicitly
    prev_room, prev_partner = cleanup_socket(sid, explicit_leave=True)
    if prev_partner:
        emit("partner_left", {"reason": "left"}, to=prev_partner)

    session = get_socket_session(sid)
    alias = session.get("alias", "Host")
    session_id = session.get("session_id", sid)

    room_id, code = room_manager.create_room(room_type="private")
    room_manager.add_member(room_id, sid, alias, session_id)
    join_room(room_id, sid=sid)

    emit("room_created", {
        "roomId": room_id,
        "roomCode": code,
        "yourAlias": alias,
        "roomType": "private",
    })


@socketio.on("join_room_code")
def handle_join_room_code(data):
    """Join an existing private room with an 8-character code."""
    sid = request.sid
    ip_hash = get_client_ip_hash()

    if is_ip_banned(ip_hash):
        emit("error_event", {"code": "LOCKED_OUT", "message": "Too many failed attempts. Try again in 5 minutes."})
        return

    code = data.get("code", "") if isinstance(data, dict) else ""
    if not validate_room_code(code):
        record_failed_room_attempt(ip_hash)
        emit("error_event", {"code": "INVALID_CODE", "message": "Room code must be 8 characters."})
        return

    room_id = room_manager.get_room_by_code(code)
    if not room_id:
        locked = record_failed_room_attempt(ip_hash)
        msg = "Too many failed attempts. Locked out for 5 minutes." if locked else "Room not found or code expired."
        emit("error_event", {"code": "ROOM_NOT_FOUND", "message": msg})
        return

    # Clean up from any previous room explicitly
    prev_room, prev_partner = cleanup_socket(sid, explicit_leave=True)
    if prev_partner:
        emit("partner_left", {"reason": "left"}, to=prev_partner)

    session = get_socket_session(sid)
    alias = session.get("alias", "Friend")
    session_id = session.get("session_id", sid)

    success = room_manager.add_member(room_id, sid, alias, session_id)
    if not success:
        emit("error_event", {"code": "ROOM_FULL", "message": "This room already has 2 participants."})
        return

    join_room(room_id, sid=sid)
    host_sid = room_manager.get_partner_sid(room_id, sid)
    host_session = room_manager.get_session_for_sid(host_sid) if host_sid else None
    host_alias = host_session.get("alias", "Friend") if host_session else "Friend"

    # Notify joining participant
    emit(
        "matched",
        {
            "roomId": room_id,
            "partnerAlias": host_alias,
            "yourAlias": alias,
            "roomType": "private",
            "roomCode": code.upper(),
        },
        to=sid,
    )

    # Notify host that friend has joined
    if host_sid:
        emit(
            "partner_joined",
            {
                "roomId": room_id,
                "partnerAlias": alias,
                "yourAlias": host_alias,
                "roomType": "private",
                "roomCode": code.upper(),
            },
            to=host_sid,
        )


@socketio.on("reconnect_room")
def handle_reconnect_room(data):
    """Re-attach a newly connected or reconnected socket to its existing room."""
    sid = request.sid
    if not isinstance(data, dict):
        return

    room_id = data.get("roomId")
    code = data.get("roomCode")
    if not room_id and code:
        room_id = room_manager.get_room_by_code(code)

    if not room_id:
        emit("reconnect_failed", {"message": "Room not found or code expired."})
        return

    room_data = room_manager.get_room(room_id)
    if not room_data:
        emit("reconnect_failed", {"message": "Room not found or code expired."})
        return

    session = get_socket_session(sid)
    alias = session.get("alias", "Friend")
    session_id = session.get("session_id", sid)

    success = room_manager.reattach_member(room_id, sid, session_id, alias)
    if not success:
        emit("reconnect_failed", {"message": "Could not re-attach to room."})
        return

    join_room(room_id, sid=sid)
    partner_sid = room_manager.get_partner_sid(room_id, sid)

    if partner_sid:
        partner_session = room_manager.get_session_for_sid(partner_sid)
        partner_alias = partner_session.get("alias", "Friend") if partner_session else "Friend"

        emit(
            "reconnected",
            {
                "roomId": room_id,
                "roomCode": room_data.get("code", code or ""),
                "partnerAlias": partner_alias,
                "yourAlias": alias,
                "roomType": room_data.get("type", "private"),
                "hasPartner": True,
            },
            to=sid,
        )

        emit(
            "partner_back",
            {
                "partnerAlias": alias,
                "message": f"{alias} reconnected.",
            },
            to=partner_sid,
        )
    else:
        emit(
            "reconnected",
            {
                "roomId": room_id,
                "roomCode": room_data.get("code", code or ""),
                "partnerAlias": None,
                "yourAlias": alias,
                "roomType": room_data.get("type", "private"),
                "hasPartner": False,
                "waiting": True,
            },
            to=sid,
        )


@socketio.on("send_message")
def handle_send_message(data):
    """Validate, sanitize, rate-limit, and relay ephemeral message."""
    sid = request.sid
    room_id = room_manager.get_room_for_sid(sid)
    if not room_id:
        emit("error_event", {"code": "NOT_IN_ROOM", "message": "You are not connected to a chat room."})
        return

    # Rate limit: 5 messages per 5s per socket
    if not allow(f"msg:{sid}", limit=5, window=5):
        emit("error_event", {"code": "RATE_LIMITED", "message": "Slow down! Maximum 5 messages per 5 seconds."})
        return

    raw_text = data.get("text") if isinstance(data, dict) else None
    clean_text = clean_message(raw_text)
    if not clean_text:
        emit("error_event", {"code": "INVALID_MESSAGE", "message": "Message cannot be empty or exceed 500 characters."})
        return

    if is_duplicate_spam(sid, clean_text):
        emit("error_event", {"code": "DUPLICATE_MESSAGE", "message": "Duplicate message suppressed."})
        return

    payload = message_service.build(sid, clean_text)
    emit("receive_message", payload, to=room_id)


@socketio.on("typing")
def handle_typing(data):
    """Relay ephemeral typing status to chat partner."""
    sid = request.sid
    room_id = room_manager.get_room_for_sid(sid)
    if not room_id:
        return

    partner_sid = room_manager.get_partner_sid(room_id, sid)
    if partner_sid:
        is_typing = bool(data.get("isTyping", False)) if isinstance(data, dict) else False
        emit("partner_typing", {"isTyping": is_typing}, to=partner_sid)


@socketio.on("leave_chat")
def handle_leave_chat():
    """Leave the current chat room and notify partner."""
    sid = request.sid
    room_id, partner_sid = cleanup_socket(sid, explicit_leave=True)
    if partner_sid:
        emit("partner_left", {"reason": "left"}, to=partner_sid)
    emit("chat_ended", {"reason": "left"})


@socketio.on("block_user")
def handle_block_user():
    """Block current chat partner and immediately leave room."""
    sid = request.sid
    room_id = room_manager.get_room_for_sid(sid)
    if room_id:
        partner_sid = room_manager.get_partner_sid(room_id, sid)
        if partner_sid:
            block_partner(sid, partner_sid)
            emit("partner_left", {"reason": "blocked"}, to=partner_sid)
    cleanup_socket(sid, explicit_leave=True)
    emit("chat_ended", {"reason": "blocked"})


@socketio.on("report_user")
def handle_report_user(data):
    """Report partner for abuse and end conversation."""
    sid = request.sid
    reason = validate_report_reason(data.get("reason", "other")) if isinstance(data, dict) else "other"
    room_id = room_manager.get_room_for_sid(sid)
    if room_id:
        partner_sid = room_manager.get_partner_sid(room_id, sid)
        if partner_sid:
            record_report(sid, partner_sid, room_id, reason)
            emit("partner_left", {"reason": "reported"}, to=partner_sid)
    cleanup_socket(sid, explicit_leave=True)
    emit("chat_ended", {"reason": "reported"})
