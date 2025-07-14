# Backend_work/mental_health_app/middleware.py
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from urllib.parse import parse_qs

User = get_user_model()

class TokenAuthMiddleware:
    """
    Custom middleware that authenticates users based on a JWT token
    provided as a query parameter in the WebSocket URL.
    """
    def __init__(self, app):
        # Store the ASGI application we were passed
        self.app = app

    async def __call__(self, scope, receive, send):
        # Look up connection parameters in query string
        query_string = scope['query_string'].decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token')

        if token:
            token = token[0]  # Get the actual token string from the list
            try:
                # Decode and validate the token using Django's JWT settings
                decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"]) # Ensure HS256 matches your JWT config

                # Get the user based on the decoded token (e.g., user ID or email)
                user = await self.get_user_from_token(decoded_data)
                if user:
                    scope['user'] = user
                else:
                    scope['user'] = None # No user found for the token
            except jwt.ExpiredSignatureError:
                print("DEBUG: JWT token has expired.")
                scope['user'] = None
            except jwt.InvalidTokenError:
                print("DEBUG: Invalid JWT token.")
                scope['user'] = None
            except Exception as e:
                print(f"DEBUG: Error during JWT authentication: {e}")
                scope['user'] = None
        else:
            scope['user'] = None # No token provided

        return await self.app(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, decoded_data):
        try:
            # Assuming 'email' is the USERNAME_FIELD in your JWT payload
            user = User.objects.get(email=decoded_data['email'])
            return user
        except User.DoesNotExist:
            return None
        except KeyError: # If 'email' key is missing from token payload
            return None