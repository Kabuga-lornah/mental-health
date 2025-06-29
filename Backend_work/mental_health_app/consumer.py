# In Backend_work/mental_health_app/consumer.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth import get_user_model 
from .models import ChatMessage, User 

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data_json = json.loads(text_data)
        message = data_json['message']
        sender_id = self.scope['user'].id # Get authenticated user ID from scope

        # Determine receiver_id based on room_name logic
        # Assuming room_name is always like 'chat_smallestID_largestID'
        parts = self.room_name.split('_')
        user1_id = int(parts[1])
        user2_id = int(parts[2])

        receiver_id = user1_id if sender_id == user2_id else user2_id
        if sender_id == user1_id and receiver_id == user1_id: # Handle if user tries to chat with themselves or invalid setup
            print("WARNING: Sender and receiver are the same or invalid configuration.")
            return

        # Save message to database
        await self.save_message(sender_id, receiver_id, self.room_name, message)

        sender_user = await self.get_user(sender_id)
        if not sender_user:
            print(f"ERROR: Sender user with ID {sender_id} not found.")
            return

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_email': sender_user.email, 
                'timestamp': str(timezone.now())
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        sender_email = event['sender_email']
        timestamp = event['timestamp']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender_email': sender_email,
            'timestamp': timestamp
        }))

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, room_name, message_content):
        sender_obj = User.objects.get(id=sender_id)
        receiver_obj = User.objects.get(id=receiver_id) # Ensure receiver exists

        ChatMessage.objects.create(
            sender=sender_obj,
            receiver=receiver_obj, # Save receiver
            room_name=room_name,
            message_content=message_content
        )

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None