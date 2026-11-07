import pytest
from app.services.room_manager import room_manager
from app.utils.room_codes import generate_room_code, ALPHABET
from app.utils.validators import validate_room_code


def test_room_code_generation():
    """Generated codes must be length 8 and use allowed alphabet."""
    for _ in range(20):
        code = generate_room_code()
        assert len(code) == 8
        assert all(ch in ALPHABET for ch in code)
        assert validate_room_code(code) is True


def test_room_code_validation_rejects_invalid():
    """Invalid code lengths and disallowed chars (0, O, 1, I) are rejected."""
    assert validate_room_code("ABC") is False
    assert validate_room_code("ABCDEFGHI") is False
    assert validate_room_code("ABCD0EFG") is False  # contains 0
    assert validate_room_code("ABCD1EFG") is False  # contains 1
    assert validate_room_code("ABCD!@#$") is False


def test_room_creation_and_member_capacity(socket_client):
    """Rooms enforce maximum of 2 participants."""
    c1 = socket_client()
    c2 = socket_client()
    c3 = socket_client()

    # Host creates room
    c1.emit("create_room")
    c1_events = c1.get_received()
    created_event = next(e for e in c1_events if e["name"] == "room_created")
    code = created_event["args"][0]["roomCode"]
    room_id = created_event["args"][0]["roomId"]

    # Client 2 joins successfully
    c2.emit("join_room_code", {"code": code})
    c2_events = c2.get_received()
    matched = [e for e in c2_events if e["name"] == "matched"]
    assert len(matched) == 1
    assert matched[0]["args"][0]["roomId"] == room_id

    # Client 3 attempts to join full room
    c3.emit("join_room_code", {"code": code})
    c3_events = c3.get_received()
    errors = [e for e in c3_events if e["name"] == "error_event"]
    assert len(errors) == 1
    assert errors[0]["args"][0]["code"] == "ROOM_FULL"

    c1.disconnect()
    c2.disconnect()
    c3.disconnect()


def test_leave_chat_notifies_partner(socket_client):
    """Leaving chat sends partner_left event to partner."""
    c1 = socket_client()
    c2 = socket_client()

    c1.emit("create_room")
    code = next(e for e in c1.get_received() if e["name"] == "room_created")["args"][0]["roomCode"]

    c2.emit("join_room_code", {"code": code})
    c1.get_received()
    c2.get_received()

    # c1 leaves
    c1.emit("leave_chat")
    c1_events = c1.get_received()
    assert any(e["name"] == "chat_ended" for e in c1_events)

    # c2 receives partner_left
    c2_events = c2.get_received()
    left_events = [e for e in c2_events if e["name"] == "partner_left"]
    assert len(left_events) == 1

    c1.disconnect()
    c2.disconnect()


def test_rest_validate_room_code(client, socket_client):
    """Test REST API /api/rooms/validate-code."""
    # Non-existent code
    resp = client.post("/api/rooms/validate-code", json={"code": "ABCDEFGH"})
    assert resp.status_code == 404

    # Create room
    c = socket_client()
    c.emit("create_room")
    code = next(e for e in c.get_received() if e["name"] == "room_created")["args"][0]["roomCode"]

    # Validate active room
    resp = client.post("/api/rooms/validate-code", json={"code": code})
    assert resp.status_code == 200
    assert resp.json["available"] is True

    c.disconnect()



def test_private_room_persists_across_mobile_disconnect(client, socket_client):
    """
    On mobile devices, when host switches apps (e.g. WhatsApp to share code),
    socket disconnects temporarily. The room and code MUST NOT be destroyed.
    """
    c_host = socket_client()
    c_host.emit("create_room")
    created = next(e for e in c_host.get_received() if e["name"] == "room_created")
    code = created["args"][0]["roomCode"]
    room_id = created["args"][0]["roomId"]

    # Host switches app (socket drops)
    c_host.disconnect()

    # Friend validates room code via REST while host is away
    resp = client.post("/api/rooms/validate-code", json={"code": code})
    assert resp.status_code == 200
    assert resp.json["available"] is True

    # Friend joins via socket
    c_friend = socket_client()
    c_friend.emit("join_room_code", {"code": code})
    matched = [e for e in c_friend.get_received() if e["name"] == "matched"]
    assert len(matched) == 1
    assert matched[0]["args"][0]["roomId"] == room_id

    # Host re-opens browser with a new socket and re-attaches
    c_host_new = socket_client()
    c_host_new.emit("reconnect_room", {"roomId": room_id, "roomCode": code})
    reconnected = [e for e in c_host_new.get_received() if e["name"] == "reconnected"]
    assert len(reconnected) == 1
    assert reconnected[0]["args"][0]["hasPartner"] is True

    # Friend receives notification that host is back
    friend_events = c_friend.get_received()
    assert any(e["name"] == "partner_back" for e in friend_events)

    c_friend.disconnect()
    c_host_new.disconnect()



def test_active_chat_disconnect_immediately_notifies_partner(socket_client):
    """
    When two users are connected in an active chat and one leaves (closes tab or disconnects),
    the other user MUST immediately receive the partner_left event.
    """
    c1 = socket_client()
    c2 = socket_client()

    c1.emit("create_room")
    code = next(e for e in c1.get_received() if e["name"] == "room_created")["args"][0]["roomCode"]

    c2.emit("join_room_code", {"code": code})
    c1.get_received()
    c2.get_received()

    # c1 closes tab / disconnects
    c1.disconnect()

    # c2 must immediately receive partner_left
    c2_events = c2.get_received()
    left_events = [e for e in c2_events if e["name"] == "partner_left"]
    assert len(left_events) == 1

    c2.disconnect()
