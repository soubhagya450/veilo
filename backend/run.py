import os
from app import create_app
from app.extensions import socketio

# Auto-detect cloud production (e.g. Render, Railway, Heroku) via PORT or RENDER environment vars
is_cloud_prod = bool(os.getenv("RENDER") or (os.getenv("PORT") and os.getenv("PORT") != "5000"))
default_env = "production" if is_cloud_prod else "development"
env_name = os.getenv("FLASK_ENV", default_env).lower()

app = create_app(env_name)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    # Never enable Werkzeug interactive debugger on cloud production
    is_debug = False if env_name == "production" else app.config.get("DEBUG", False)

    print("==================================================")
    print(f"  Veilo Backend running on http://{host}:{port}")
    print("  Socket.IO & REST endpoints active")
    print(f"  Environment: {env_name}")
    print("==================================================")

    socketio.run(
        app,
        host=host,
        port=port,
        debug=is_debug,
        allow_unsafe_werkzeug=True,
    )
