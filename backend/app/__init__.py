import logging
import os
from flask import Flask
from flask_cors import CORS
from app.config import config_by_name
from app.extensions import init_extensions, socketio


def create_app(config_name: str = None) -> Flask:
    """Application factory for Veilo backend."""
    if not config_name:
        config_name = os.getenv("FLASK_ENV", "development").lower()

    app = Flask(__name__)
    config_cls = config_by_name.get(config_name, config_by_name["development"])
    app.config.from_object(config_cls)

    # Logging setup
    logging.basicConfig(
        level=getattr(logging, app.config["LOG_LEVEL"], logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # Configure CORS
    allowed_origins = app.config.get("CORS_ALLOWED_ORIGINS", ["*"])
    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=False,
    )

    # Security headers
    if not app.config.get("TESTING") and config_name == "production":
        try:
            from flask_talisman import Talisman
            Talisman(
                app,
                force_https=False,  # Let reverse proxy / PaaS handle HTTPS
                strict_transport_security=True,
                session_cookie_secure=True,
                session_cookie_http_only=True,
                content_security_policy=None,
            )
        except Exception:
            pass

    # Initialize extensions (SocketIO, Storage, Serializer)
    init_extensions(app)

    # Register blueprints
    from app.routes import api_bp
    app.register_blueprint(api_bp)

    # Import socket events to bind handlers
    from app import socket_events  # noqa: F401

    return app
