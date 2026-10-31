"""Veilo REST API routes."""
from flask import Blueprint

api_bp = Blueprint("api", __name__, url_prefix="/api")

from app.routes.health import health_bp
from app.routes.rooms import rooms_bp

api_bp.register_blueprint(health_bp)
api_bp.register_blueprint(rooms_bp)
