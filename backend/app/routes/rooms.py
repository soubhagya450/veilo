import secrets
from flask import Blueprint, jsonify, request
from app.services.room_manager import room_manager
from app.utils.room_codes import (
    generate_guest_alias,
    generate_session_token,
    verify_session_token,
)
from app.utils.validators import validate_room_code

rooms_bp = Blueprint("rooms", __name__)


@rooms_bp.route("/session", methods=["POST", "GET"])
def get_session():
    """Issue a new anonymous signed session token and guest alias."""
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()

    verified = verify_session_token(token) if token else None
    if verified:
        session_id, alias = verified
        fresh_token = generate_session_token(session_id, alias)
        return jsonify({
            "token": fresh_token,
            "alias": alias,
            "sessionId": session_id,
            "reused": True,
        }), 200

    session_id = secrets.token_urlsafe(12)
    alias = generate_guest_alias()
    new_token = generate_session_token(session_id, alias)

    return jsonify({
        "token": new_token,
        "alias": alias,
        "sessionId": session_id,
        "reused": False,
    }), 200


@rooms_bp.route("/rooms/validate-code", methods=["POST"])
def check_room_code():
    """Validate 8-character room code format and check room availability."""
    data = request.get_json(silent=True) or {}
    code = data.get("code", "")

    if not validate_room_code(code):
        return jsonify({
            "valid": False,
            "available": False,
            "message": "Room code must be 8 alphanumeric characters.",
        }), 400

    room_id = room_manager.get_room_by_code(code)
    if not room_id:
        return jsonify({
            "valid": True,
            "available": False,
            "message": "Room not found or code expired.",
        }), 404

    members = room_manager.get_room_members(room_id)
    if len(members) >= 2:
        return jsonify({
            "valid": True,
            "available": False,
            "message": "Room is already full.",
        }), 409

    return jsonify({
        "valid": True,
        "available": True,
        "message": "Room code is valid and available.",
    }), 200
