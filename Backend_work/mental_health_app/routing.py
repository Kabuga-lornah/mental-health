# Backend_work/mental_health_app/routing.py
from django.urls import re_path
from . import consumer # <--- Import your consumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumer.ChatConsumer.as_asgi()),
]