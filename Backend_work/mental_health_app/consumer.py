import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import ChatMessage, User, ChatRoom 

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

        # Determine receiver_id based on room_name logic (e.g., "chat_ID1_ID2")
        parts = self.room_name.split('_')
        # Adjusting parsing based on `TherapistDetail.jsx` creating "chat_ID1_ID2"
        if len(parts) == 3 and parts[0] == 'chat':
            user1_id = int(parts[1])
            user2_id = int(parts[2])
        else: # Fallback if room_name is just "ID1_ID2" (less likely given frontend)
            user1_id = int(parts[0])
            user2_id = int(parts[1])

        # Ensure sender is one of the users in the room
        if sender_id not in [user1_id, user2_id]:
            print(f"ERROR: Authenticated user {sender_id} is not part of room {self.room_name}")
            return

        receiver_id = user2_id if sender_id == user1_id else user1_id
        if sender_id == user1_id and receiver_id == user1_id:
            print("WARNING: Sender and receiver are the same or invalid configuration.")
            return

        try:
            # <--- NEW: Get or create the ChatRoom instance for this conversation
            chat_room_obj = await self.get_or_create_chat_room(user1_id, user2_id)
            # Save message to database, passing the actual ChatRoom object
            await self.save_message(sender_id, receiver_id, chat_room_obj, message)
        except Exception as e:
            print(f"ERROR saving message: {e}")
            return

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
    def get_or_create_chat_room(self, user1_id, user2_id):
        # Ensure user IDs are sorted for consistent room name lookup and creation
        ordered_ids = sorted([user1_id, user2_id])
        room_name_from_ids = f"chat_{ordered_ids[0]}_{ordered_ids[1]}"

        # Retrieve user objects (or create if they don't exist, though typically they should)
        user1_obj = User.objects.get(id=ordered_ids[0])
        user2_obj = User.objects.get(id=ordered_ids[1])

        chat_room, created = ChatRoom.objects.get_or_create(
            name=room_name_from_ids,
            defaults={'user1': user1_obj, 'user2': user2_obj}
        )
        return chat_room

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, chat_room_obj, message_content): 
        sender_obj = User.objects.get(id=sender_id)
        receiver_obj = User.objects.get(id=receiver_id)

        ChatMessage.objects.create(
            sender=sender_obj,
            receiver=receiver_obj,
            chat_room=chat_room_obj, 
            message_content=message_content
        )

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None