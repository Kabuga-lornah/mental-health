"""
ASGI config for mental_health_project project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from mental_health_app import consumers # You'd create this file

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mental_health_project.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            [
                path("ws/chat/<str:room_name>/", consumers.ChatConsumer.as_asgi()),
               
            ]
        )
    ),
})
