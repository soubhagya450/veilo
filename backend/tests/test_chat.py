import pytest
from app.utils.validators import clean_message


def test_clean_message_valid():
    """Valid message cleans whitespace and retains text."""
    msg = "  Hello, this is a clean message!  "
    assert clean_message(msg) == "Hello, this is a clean message!"


def test_clean_message_rejects_empty():
    """Empty or whitespace-only messages return None."""
    assert clean_message("") is None
    assert clean_message("   ") is None
    assert clean_message(None) is None


def test_clean_message_strips_control_chars():
    """Control characters are stripped from message."""
    raw = "Hello\x00\x08World\x1f!"
    assert clean_message(raw) == "HelloWorld!"


def test_clean_message_max_length():
    """Messages exceeding 500 characters are rejected."""
    long_msg = "A" * 501
    assert clean_message(long_msg) is None
    exact_msg = "A" * 500
    assert clean_message(exact_msg) == exact_msg


def test_unauthorized_send_message(socket_client):
    """Sending a message when not in a room returns NOT_IN_ROOM error."""
    client = socket_client()
    assert client.is_connected()

    # Clear initial events
    client.get_received()

    client.emit("send_message", {"text": "Hello world!"})
    events = client.get_received()

    error_events = [e for e in events if e["name"] == "error_event"]
    assert len(error_events) > 0
    assert error_events[0]["args"][0]["code"] == "NOT_IN_ROOM"
    client.disconnect()


def test_message_delivery_between_room_members(socket_client):
    """Messages sent in a private room are delivered to both participants."""
    client1 = socket_client()
    client2 = socket_client()

    # Host creates room
    client1.emit("create_room")
    c1_events = client1.get_received()
    room_created = next(e for e in c1_events if e["name"] == "room_created")
    room_code = room_created["args"][0]["roomCode"]

    # Guest joins room
    client2.emit("join_room_code", {"code": room_code})
    client1.get_received()
    client2.get_received()

    # Client 1 sends message
    test_text = "Hey partner, secret message!"
    client1.emit("send_message", {"text": test_text})

    c2_events = client2.get_received()
    msg_events = [e for e in c2_events if e["name"] == "receive_message"]
    assert len(msg_events) == 1
    assert msg_events[0]["args"][0]["text"] == test_text

    client1.disconnect()
    client2.disconnect()


def test_message_rate_limiting(socket_client):
    """Sending more than 5 messages in 5 seconds triggers RATE_LIMITED error."""
    client1 = socket_client()
    client2 = socket_client()

    client1.emit("create_room")
    c1_events = client1.get_received()
    room_code = next(e for e in c1_events if e["name"] == "room_created")["args"][0]["roomCode"]

    client2.emit("join_room_code", {"code": room_code})
    client1.get_received()
    client2.get_received()

    # Send 6 rapid distinct messages
    rate_limited = False
    for i in range(7):
        client1.emit("send_message", {"text": f"Message number {i}"})

    events = client1.get_received()
    error_events = [e for e in events if e["name"] == "error_event"]
    assert any(e["args"][0]["code"] == "RATE_LIMITED" for e in error_events)

    client1.disconnect()
    client2.disconnect()
