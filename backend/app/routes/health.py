import time
from flask import Blueprint, jsonify
from app import extensions

health_bp = Blueprint("health", __name__)
START_TIME = time.time()


@health_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint providing runtime and storage metrics."""
    uptime = int(time.time() - START_TIME)
    is_connected = extensions.redis_client.is_connected
    storage_type = "redis" if is_connected else "in-memory"

    return jsonify({
        "status": "ok",
        "service": "veilo-backend",
        "uptimeSeconds": uptime,
        "storage": storage_type,
        "redisConnected": is_connected,
        "realtime": "socket.io",
        "timestamp": int(time.time() * 1000),
    }), 200
