import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data_json = json.loads(text_data)
        message = data_json['message']
        sender_id = self.scope['user'].id # Get authenticated user ID

        await self.save_message(sender_id, self.room_name, message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_email': self.scope['user'].email,
                'timestamp': str(ChatMessage.objects.last().timestamp) # This is simplified
            }
        )

    async def chat_message(self, event):
        message = event['message']
        sender_email = event['sender_email']
        timestamp = event['timestamp']

        await self.send(text_data=json.dumps({
            'message': message,
            'sender_email': sender_email,
            'timestamp': timestamp
        }))

    @database_sync_to_async
    def save_message(self, sender_id, room_name, message_content):
        sender = User.objects.get(id=sender_id)

        ChatMessage.objects.create(
            sender=sender,
            room_name=room_name,
            message_content=message_content
        )