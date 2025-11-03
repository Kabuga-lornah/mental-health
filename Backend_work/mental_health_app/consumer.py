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
        self.room_group_name = self.room_name
        
        # --- PRESENCE: On connect ---
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Update user status to online
        await self.update_user_status(self.user.id, True)
        
        # Broadcast presence to the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'user_id': self.user.id,
                'is_online': True
            }
        )
        # --- END PRESENCE ---

    async def disconnect(self, close_code):
        # --- PRESENCE: On disconnect ---
        if self.user.is_authenticated:
            # Update user status to offline and set last_seen
            last_seen_time = await self.update_user_status(self.user.id, False)
            
            # Broadcast presence to the room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_update',
                    'user_id': self.user.id,
                    'is_online': False,
                    'last_seen': str(last_seen_time)
                }
            )
        # --- END PRESENCE ---

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data_json = json.loads(text_data)
        message_type = data_json.get('type', 'chat_message') # Default to chat_message

        if message_type == 'mark_as_read':
            # --- READ RECEIPTS: Handle read event ---
            message_ids = data_json.get('message_ids', [])
            await self.mark_messages_as_read(message_ids)
            
            # Broadcast to the room that these messages were read
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'messages_read',
                    'message_ids': message_ids,
                    'reader_id': self.user.id
                }
            )
            # --- END READ RECEIPTS ---

        elif message_type == 'chat_message':
            # --- CHAT MESSAGE: Handle sending a new message ---
            message = data_json['message']
            sender_id = self.user.id

            # ... (existing logic to find user1_id, user2_id, and receiver_id)
            parts = self.room_name.split('_')
            if len(parts) == 3 and parts[0] == 'chat':
                user1_id = int(parts[1])
                user2_id = int(parts[2])
            else:
                print(f"ERROR: Invalid room_name format: {self.room_name}")
                return
            
            if sender_id not in [user1_id, user2_id]:
                print(f"ERROR: Authenticated user {sender_id} is not part of room {self.room_name}")
                return
            receiver_id = user2_id if sender_id == user1_id else user1_id
            
            try:
                chat_room_obj = await self.get_or_create_chat_room(user1_id, user2_id)
                
                # Save message and GET THE NEW MESSAGE OBJECT BACK
                new_msg = await self.save_message(sender_id, receiver_id, chat_room_obj, message)
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
                    'sender_id': sender_id,
                    'sender_email': sender_user.email,
                    'timestamp': str(new_msg.timestamp), # Use precise timestamp from DB
                    'message_id': new_msg.id,         # <-- SEND NEW MESSAGE ID
                    'is_read': False                  # <-- SEND READ STATUS
                }
            )
            # --- END CHAT MESSAGE ---

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message', # <-- Add type
            'message': event['message'],
            'sender_email': event.get('sender_email'),
            'sender_id': event.get('sender_id'),
            'timestamp': event['timestamp'],
            'message_id': event['message_id'], # <-- Pass ID to client
            'is_read': event['is_read']        # <-- Pass read status to client
        }))

    # --- NEW HANDLER for presence update ---
    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'user_id': event['user_id'],
            'is_online': event['is_online'],
            'last_seen': event.get('last_seen')
        }))

    # --- NEW HANDLER for read receipts ---
    async def messages_read(self, event):
        await self.send(text_data=json.dumps({
            'type': 'messages_read',
            'message_ids': event['message_ids'],
            'reader_id': event['reader_id']
        }))

    # --- NEW DB METHOD for presence ---
    @database_sync_to_async
    def update_user_status(self, user_id, is_online):
        now = timezone.now()
        User.objects.filter(id=user_id).update(
            is_online=is_online,
            last_seen=now if not is_online else None
        )
        return now

    # --- NEW DB METHOD for read receipts ---
    @database_sync_to_async
    def mark_messages_as_read(self, message_ids):
        # Mark messages as read where this user is the receiver
        ChatMessage.objects.filter(
            id__in=message_ids, 
            receiver=self.user
        ).update(is_read=True)

    # --- (existing get_or_create_chat_room) ---
    @database_sync_to_async
    def get_or_create_chat_room(self, user1_id, user2_id):
        # ... (no change)
        ordered_ids = sorted([user1_id, user2_id])
        room_name_from_ids = f"chat_{ordered_ids[0]}_{ordered_ids[1]}"
        user1_obj = User.objects.get(id=ordered_ids[0])
        user2_obj = User.objects.get(id=ordered_ids[1])
        chat_room, created = ChatRoom.objects.get_or_create(
            name=room_name_from_ids,
            defaults={'user1': user1_obj, 'user2': user2_obj}
        )
        return chat_room


    # --- MODIFIED save_message to return the object ---
    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, chat_room_obj, message_content): 
        sender_obj = User.objects.get(id=sender_id)
        receiver_obj = User.objects.get(id=receiver_id)

        # Create and return the new message object
        new_msg = ChatMessage.objects.create(
            sender=sender_obj,
            receiver=receiver_obj,
            chat_room=chat_room_obj, 
            message_content=message_content
        )
        return new_msg # <-- RETURN THE OBJECT

    # --- (existing get_user) ---
    @database_sync_to_async
    def get_user(self, user_id):
        # ... (no change)
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None