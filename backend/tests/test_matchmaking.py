import pytest


def test_stranger_queue_and_pairing(socket_client):
    """Two waiting strangers are paired into a temporary room."""
    c1 = socket_client()
    c2 = socket_client()

    # Client 1 searches
    c1.emit("find_stranger")
    c1_events = c1.get_received()
    assert any(e["name"] == "searching" for e in c1_events)

    # Client 2 searches -> should trigger match
    c2.emit("find_stranger")
    c2_events = c2.get_received()
    c2_matched = [e for e in c2_events if e["name"] == "matched"]
    assert len(c2_matched) == 1

    # Client 1 also receives matched
    c1_events2 = c1.get_received()
    c1_matched = [e for e in c1_events2 if e["name"] == "matched"]
    assert len(c1_matched) == 1
    assert c1_matched[0]["args"][0]["roomId"] == c2_matched[0]["args"][0]["roomId"]

    c1.disconnect()
    c2.disconnect()


def test_cancel_search(socket_client):
    """Cancelling search removes user from waiting queue."""
    c = socket_client()
    c.emit("find_stranger")
    assert any(e["name"] == "searching" for e in c.get_received())

    c.emit("cancel_search")
    cancelled = [e for e in c.get_received() if e["name"] == "search_cancelled"]
    assert len(cancelled) == 1

    c.disconnect()


def test_blocked_user_exclusion(socket_client):
    """Users who have blocked each other are never rematched."""
    c1 = socket_client()
    c2 = socket_client()

    # Pair them first
    c1.emit("find_stranger")
    c2.emit("find_stranger")

    c1.get_received()
    c2.get_received()

    # c1 blocks c2
    c1.emit("block_user")
    c1.get_received()
    c2.get_received()

    # c1 searches again
    c1.emit("find_stranger")
    c1_events = c1.get_received()
    assert any(e["name"] == "searching" for e in c1_events)

    # c2 searches again -> should NOT match with c1
    c2.emit("find_stranger")
    c2_events = c2.get_received()
    assert any(e["name"] == "searching" for e in c2_events)
    assert not any(e["name"] == "matched" for e in c2_events)

    c1.disconnect()
    c2.disconnect()
