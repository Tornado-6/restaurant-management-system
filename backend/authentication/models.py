from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('waiter', 'Waiter'),
        ('chef', 'Chef'),
        ('cashier', 'Cashier'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone_number = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    
    # New field for password reset
    password_reset_token = models.CharField(max_length=100, blank=True, null=True, unique=True)
    password_reset_token_created_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'users'
        
    def __str__(self):
        return f"{self.username} - {self.role}"
