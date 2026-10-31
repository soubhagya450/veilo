import os
from app import create_app
from app.extensions import socketio

app = create_app(os.getenv("FLASK_ENV", "development"))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = app.config.get("DEBUG", False)

    print(f"==================================================")
    print(f"  Veilo Backend running on http://{host}:{port}")
    print(f"  Socket.IO & REST endpoints active")
    print(f"  Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"==================================================")

    socketio.run(
        app,
        host=host,
        port=port,
        debug=debug,
        allow_unsafe_werkzeug=True,
    )
