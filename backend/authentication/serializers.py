from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator, RegexValidator
import re

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    email = serializers.EmailField(
        validators=[EmailValidator()],
        required=True
    )
    username = serializers.CharField(
        required=True,
        min_length=3,
        max_length=50,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9_]+$',
                message='Username can only contain letters, numbers, and underscores'
            )
        ]
    )
    role = serializers.ChoiceField(
        choices=User.ROLE_CHOICES,
        required=True
    )
    first_name = serializers.CharField(
        required=True,
        min_length=2,
        max_length=50,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z\s]+$',
                message='First name can only contain letters and spaces'
            )
        ]
    )
    last_name = serializers.CharField(
        required=True,
        min_length=2,
        max_length=50,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z\s]+$',
                message='Last name can only contain letters and spaces'
            )
        ]
    )
    phone_number = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message='Enter a valid phone number'
            )
        ]
    )

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password', 
            'first_name', 'last_name', 'role', 
            'phone_number', 'address'
        )
        extra_kwargs = {
            'password': {'write_only': True},
            'address': {'required': False, 'allow_blank': True}
        }

    def validate_password(self, value):
        # Custom password validation
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        # Check for at least one uppercase, one lowercase, one number, and one special character
        if not re.search(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$', value):
            raise serializers.ValidationError(
                "Password must include at least one uppercase letter, "
                "one lowercase letter, one number, and one special character."
            )
        
        return value

    def validate(self, data):
        # Comprehensive data validation
        errors = {}

        # Check username
        if User.objects.filter(username=data['username']).exists():
            errors['username'] = "A user with this username already exists."

        # Check email
        if User.objects.filter(email=data['email']).exists():
            errors['email'] = "A user with this email already exists."

        # Validate role
        if data['role'] not in dict(User.ROLE_CHOICES):
            errors['role'] = "Invalid role selected."

        # Raise validation error if any errors found
        if errors:
            raise serializers.ValidationError(errors)
        
        return data

    def create(self, validated_data):
        # Create user with all provided fields
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role=validated_data['role'],
            phone_number=validated_data.get('phone_number', ''),
            address=validated_data.get('address', '')
        )
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                 'role', 'phone_number', 'address')
        read_only_fields = ('id', 'username')

import secrets
import logging

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator, RegexValidator
from django.core.mail import send_mail
from django.conf import settings
import re

logger = logging.getLogger(__name__)

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, email):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email address.")
        return email

    def create_reset_token(self, user):
        # Generate a secure reset token
        reset_token = secrets.token_urlsafe(32)
        user.password_reset_token = reset_token
        user.save(update_fields=['password_reset_token'])
        return reset_token

    def send_reset_email(self, email, reset_token):
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        try:
            send_mail(
                'Password Reset Request',
                f'Click the following link to reset your password: {reset_url}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
            raise serializers.ValidationError("Failed to send reset email. Please try again later.")

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'}
    )

    def validate(self, data):
        # Check if passwords match
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")

        # Validate token
        try:
            user = User.objects.get(password_reset_token=data['token'])
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired reset token.")

        # Additional token expiration check (optional)
        # You might want to add a timestamp to track token creation time
        
        return data

    def save(self):
        user = User.objects.get(password_reset_token=self.validated_data['token'])
        user.set_password(self.validated_data['new_password'])
        user.password_reset_token = None  # Invalidate token after use
        user.save()
