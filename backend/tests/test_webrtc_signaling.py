import pytest


def test_call_initiate_rejected_when_not_in_room(socket_client):
    """User not in any room cannot initiate calls."""
    c1 = socket_client()
    c1.emit("call_initiate", {"callType": "voice"})
    events = c1.get_received()
    call_errors = [e for e in events if e["name"] == "call_error"]
    assert len(call_errors) == 1
    assert call_errors[0]["args"][0]["code"] == "NOT_IN_ROOM"


def test_call_initiate_rejected_in_stranger_chat(socket_client):
    """Calls are strictly restricted from stranger/random chat rooms."""
    c1 = socket_client()
    c2 = socket_client()

    # Pair two strangers
    c1.emit("find_stranger")
    c2.emit("find_stranger")
    c1.get_received()
    c2.get_received()

    # Attempt to start voice call in stranger room
    c1.emit("call_initiate", {"callType": "voice"})
    c1_events = c1.get_received()
    call_errors = [e for e in c1_events if e["name"] == "call_error"]
    assert len(call_errors) == 1
    assert call_errors[0]["args"][0]["code"] == "NOT_PRIVATE_ROOM"


def test_call_initiate_rejected_when_no_partner_yet(socket_client):
    """Host waiting for friend in private room cannot start call alone."""
    c1 = socket_client()
    c1.emit("create_room")
    c1.get_received()

    c1.emit("call_initiate", {"callType": "video"})
    c1_events = c1.get_received()
    call_errors = [e for e in c1_events if e["name"] == "call_error"]
    assert len(call_errors) == 1
    assert call_errors[0]["args"][0]["code"] == "NO_PARTNER"


def test_webrtc_signaling_full_flow(socket_client):
    """Full WebRTC signaling cycle: initiate -> ringing -> incoming -> accept -> offer -> answer -> ICE -> hangup."""
    c1 = socket_client()
    c2 = socket_client()

    # 1. Create and join private room
    c1.emit("create_room")
    created = next(e for e in c1.get_received() if e["name"] == "room_created")
    code = created["args"][0]["roomCode"]

    c2.emit("join_room_code", {"code": code})
    c1.get_received()
    c2.get_received()

    # 2. Host initiates video call
    c1.emit("call_initiate", {"callType": "video"})
    c1_events = c1.get_received()
    c2_events = c2.get_received()

    # Caller receives call_ringing
    assert any(e["name"] == "call_ringing" and e["args"][0]["callType"] == "video" for e in c1_events)
    # Callee receives call_incoming
    incoming = next(e for e in c2_events if e["name"] == "call_incoming")
    assert incoming["args"][0]["callType"] == "video"

    # 3. Friend accepts the call
    c2.emit("call_accept", {"callType": "video"})
    c1_accepted = next(e for e in c1.get_received() if e["name"] == "call_accepted")
    assert c1_accepted["args"][0]["callType"] == "video"

    # 4. Host sends WebRTC offer SDP
    mock_offer = {"type": "offer", "sdp": "v=0\r\no=mock 123 456 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n"}
    c1.emit("webrtc_offer", {"sdp": mock_offer, "callType": "video"})
    offer_event = next(e for e in c2.get_received() if e["name"] == "webrtc_offer")
    assert offer_event["args"][0]["sdp"] == mock_offer
    assert offer_event["args"][0]["callType"] == "video"

    # 5. Friend sends WebRTC answer SDP
    mock_answer = {"type": "answer", "sdp": "v=0\r\no=mock 789 012 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n"}
    c2.emit("webrtc_answer", {"sdp": mock_answer})
    answer_event = next(e for e in c1.get_received() if e["name"] == "webrtc_answer")
    assert answer_event["args"][0]["sdp"] == mock_answer

    # 6. Exchange ICE candidates
    mock_candidate = {"candidate": "candidate:1 1 UDP 2130706431 192.168.1.1 50000 typ host", "sdpMid": "0"}
    c1.emit("webrtc_ice_candidate", {"candidate": mock_candidate})
    ice_event = next(e for e in c2.get_received() if e["name"] == "webrtc_ice_candidate")
    assert ice_event["args"][0]["candidate"] == mock_candidate

    # 7. End call
    c1.emit("end_call", {"reason": "hangup"})
    end_event = next(e for e in c2.get_received() if e["name"] == "call_ended")
    assert end_event["args"][0]["reason"] == "hangup"


def test_call_declined_flow(socket_client):
    """Callee declining call notifies caller immediately."""
    c1 = socket_client()
    c2 = socket_client()

    c1.emit("create_room")
    code = next(e for e in c1.get_received() if e["name"] == "room_created")["args"][0]["roomCode"]
    c2.emit("join_room_code", {"code": code})
    c1.get_received()
    c2.get_received()

    c1.emit("call_initiate", {"callType": "voice"})
    c1.get_received()
    c2.get_received()

    # Decline call
    c2.emit("call_reject", {"reason": "declined"})
    rejected_event = next(e for e in c1.get_received() if e["name"] == "call_rejected")
    assert rejected_event["args"][0]["reason"] == "declined"
