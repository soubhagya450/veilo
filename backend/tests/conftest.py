import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from app import create_app
from app import extensions
from app.extensions import socketio


@pytest.fixture(scope="session")
def app():
    """Create test application for the session."""
    application = create_app("testing")
    return application


@pytest.fixture(autouse=True)
def clean_storage():
    """Clean storage before and after each test."""
    extensions.redis_client.flushall()
    yield
    extensions.redis_client.flushall()


@pytest.fixture(scope="function")
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture(scope="function")
def socket_client(app, client):
    """Socket.IO test client helper."""
    clients = []

    def _create_client(token=None):
        auth = {"token": token} if token else {}
        sc = socketio.test_client(app, flask_test_client=client, auth=auth)
        clients.append(sc)
        return sc

    yield _create_client

    for sc in clients:
        try:
            if sc.is_connected():
                sc.disconnect()
        except Exception:
            pass
