#
# FILENAME: kabuga-lornah/mental-health/mental-health-5adb6da1f187483339d21664b8dc58ed73a5aa9b/Backend_work/mental_health_app/middleware.py
#
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    """
    Decodes the JWT token using simple-jwt's AccessToken object
    and retrieves the user.
    """
    try:
        # Use simple-jwt's AccessToken class to validate and decode the token
        token = AccessToken(token_key)
        
        # Get the user ID from the token payload (this is the standard key)
        user_id = token.get('user_id')
        
        if user_id:
            return User.objects.get(id=user_id)

        # Fallback: if user_id is not present, try 'email' as your token had it
        user_email = token.get('email')
        if user_email:
            return User.objects.get(email=user_email)
            
        # If neither key is found, return AnonymousUser
        print("Token payload contains no 'user_id' or 'email'")
        return AnonymousUser()

    except (InvalidToken, TokenError, User.DoesNotExist, Exception) as e:
        # Catch all errors (e.g., token expired, invalid, user not found)
        print(f"WebSocket auth error: {e}")
        return AnonymousUser()


class TokenAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSockets using a JWT token in the query string.
    """
    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        # Get the token from the query string
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            # If token is provided, try to authenticate
            scope['user'] = await get_user_from_token(token)
        else:
            # If no token, set user to AnonymousUser
            scope['user'] = AnonymousUser()
            
        if scope['user'] == AnonymousUser():
             print("WebSocket connection proceeding as AnonymousUser.")
        else:
            print(f"WebSocket connected for user: {scope['user']}")

        return await super().__call__(scope, receive, send)