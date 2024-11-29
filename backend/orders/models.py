from django.db import models
from authentication.models import User
from kitchen.models import MenuItem
from tables.models import Table

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('served', 'Served'),
        ('cancelled', 'Cancelled'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True)
    waiter = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='waiter_orders')
    chef = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='chef_orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_preparing_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    special_instructions = models.TextField(blank=True)
    is_paid = models.BooleanField(default=False)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    estimated_preparation_time = models.IntegerField(null=True, blank=True)  # in minutes
    actual_preparation_time = models.IntegerField(null=True, blank=True)  # in minutes
    
    class Meta:
        db_table = 'orders'
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['priority', 'created_at']),
        ]
    
    def __str__(self):
        return f"Order #{self.id} - {self.table}"
    
    def calculate_preparation_time(self):
        """
        Calculate actual preparation time when order is completed
        """
        if self.started_preparing_at and self.completed_at:
            prep_time = (self.completed_at - self.started_preparing_at).total_seconds() / 60
            self.actual_preparation_time = round(prep_time)
            self.save(update_fields=['actual_preparation_time'])
    
    def update_priority(self):
        """
        Automatically update order priority based on wait time
        """
        from django.utils import timezone
        
        wait_time = (timezone.now() - self.created_at).total_seconds() / 60
        
        if wait_time > 45:
            self.priority = 'urgent'
        elif wait_time > 30:
            self.priority = 'high'
        elif wait_time > 15:
            self.priority = 'normal'
        else:
            self.priority = 'low'
        
        self.save(update_fields=['priority'])

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'order_items'
    
    def save(self, *args, **kwargs):
        # If price is not set, try to get it from menu item
        if self.price is None and self.menu_item:
            self.price = self.menu_item.price
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.menu_item} x{self.quantity}"

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('upi', 'UPI'),
    )
    
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    transaction_id = models.CharField(max_length=100, blank=True)
    payment_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payments'
    
    def __str__(self):
        return f"Payment for Order #{self.order.id}"
