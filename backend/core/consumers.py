import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()

class RestaurantConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            # Get token from query string
            token = self.scope['query_string'].decode().split('=')[1]
            
            # Validate token and get user
            user = await self.get_user_from_token(token)
            if not user:
                await self.close()
                return

            self.user = user
            self.room_group_name = 'restaurant_updates'

            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()
        except Exception as e:
            print(f"WebSocket connection error: {str(e)}")
            await self.close()

    async def disconnect(self, close_code):
        # Leave room group
        try:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        except Exception as e:
            print(f"WebSocket disconnection error: {str(e)}")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            payload = text_data_json.get('payload', {})

            # Handle different message types
            if message_type == 'order_status_update':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'order_status_update',
                        'payload': payload
                    }
                )
            elif message_type == 'table_status_update':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'table_status_update',
                        'payload': payload
                    }
                )
            elif message_type == 'new_order':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'new_order',
                        'payload': payload
                    }
                )
            elif message_type == 'reservation_update':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'reservation_update',
                        'payload': payload
                    }
                )
        except json.JSONDecodeError:
            print("Invalid JSON format received")
        except Exception as e:
            print(f"Error processing WebSocket message: {str(e)}")

    # Message handlers
    async def order_status_update(self, event):
        try:
            await self.send(text_data=json.dumps({
                'type': 'order_status_update',
                'payload': event['payload']
            }))
        except Exception as e:
            print(f"Error sending order status update: {str(e)}")

    async def table_status_update(self, event):
        try:
            await self.send(text_data=json.dumps({
                'type': 'table_status_update',
                'payload': event['payload']
            }))
        except Exception as e:
            print(f"Error sending table status update: {str(e)}")

    async def new_order(self, event):
        try:
            await self.send(text_data=json.dumps({
                'type': 'new_order',
                'payload': event['payload']
            }))
        except Exception as e:
            print(f"Error sending new order notification: {str(e)}")

    async def reservation_update(self, event):
        try:
            await self.send(text_data=json.dumps({
                'type': 'reservation_update',
                'payload': event['payload']
            }))
        except Exception as e:
            print(f"Error sending reservation update: {str(e)}")

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            # Validate token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user from database
            return User.objects.get(id=user_id)
        except (InvalidToken, TokenError, User.DoesNotExist):
            return None
