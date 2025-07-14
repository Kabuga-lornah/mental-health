# Backend_work/mental_health_project/asgi.py
"""
ASGI config for mental_health_project project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""


import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mental_health_project.settings')

django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.auth import AuthMiddlewareStack # <--- You can remove or comment this line
from mental_health_app import routing
from mental_health_app.middleware import TokenAuthMiddleware # <--- NEW: Import your custom middleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    # Changed AuthMiddlewareStack to TokenAuthMiddleware
    "websocket": TokenAuthMiddleware( # <--- NEW: Use your custom middleware here
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})