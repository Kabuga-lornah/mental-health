#
# FILENAME: kabuga-lornah/mental-health/mental-health-5adb6da1f187483339d21664b8dc58ed73a5aa9b/Backend_work/mental_health_project/asgi.py
#
import os
from django.core.asgi import get_asgi_application

# --- THIS IS THE FIX ---

# 1. Set the settings module path
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mental_health_project.settings')

# 2. Initialize Django's ASGI application. 
# THIS MUST HAPPEN BEFORE importing other modules that rely on Django (like your middleware).
django_asgi_app = get_asgi_application()

# 3. Now that settings are configured, it is safe to import these
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from mental_health_app.middleware import TokenAuthMiddleware
import mental_health_app.routing

# --- END OF FIX ---


application = ProtocolTypeRouter({
    # HTTP requests are handled by the default Django ASGI app
    "http": django_asgi_app,

    # WebSocket requests are handled here
    "websocket": TokenAuthMiddleware(
        AuthMiddlewareStack(
            URLRouter(
                mental_health_app.routing.websocket_urlpatterns
            )
        )
    ),
})