from django.db import models
from django.utils import timezone
from authentication.models import User

class MenuItem(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50)
    image = models.ImageField(upload_to='menu_items/', null=True, blank=True)
    is_available = models.BooleanField(default=True)
    is_vegetarian = models.BooleanField(default=False)
    preparation_time = models.IntegerField(help_text='Preparation time in minutes')
    
    class Meta:
        db_table = 'kitchen_menu_items'
    
    def __str__(self):
        return self.name

class Ingredient(models.Model):
    UNIT_CHOICES = [
        # Weight Units
        ('kg', 'Kilograms'),
        ('g', 'Grams'),
        ('lb', 'Pounds'),
        ('oz', 'Ounces'),
        
        # Volume Units
        ('l', 'Liters'),
        ('ml', 'Milliliters'),
        ('cup', 'Cups'),
        ('tbsp', 'Tablespoons'),
        ('tsp', 'Teaspoons'),
        ('fl_oz', 'Fluid Ounces'),
        ('gal', 'Gallons'),
        
        # Count Units
        ('pcs', 'Pieces'),
        ('bunch', 'Bunch'),
        ('slice', 'Slice'),
        ('pack', 'Pack'),
        
        # Specialized Units
        ('can', 'Can'),
        ('bottle', 'Bottle'),
        ('box', 'Box'),
    ]

    CATEGORY_CHOICES = (
        ('produce', 'Produce'),
        ('meat', 'Meat'),
        ('dairy', 'Dairy'),
        ('dry_goods', 'Dry Goods'),
        ('spices', 'Spices'),
        ('beverages', 'Beverages'),
    )

    name = models.CharField(max_length=100)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='pcs')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='dry_goods')
    
    reorder_level = models.DecimalField(max_digits=10, decimal_places=2, default=10)
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2, default=1.00)
    
    menu_items = models.ManyToManyField(MenuItem, through='MenuItemIngredient')
    
    last_restocked_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    is_perishable = models.BooleanField(default=False)
    expiration_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'ingredients'
        indexes = [
            models.Index(fields=['name', 'category']),
            models.Index(fields=['quantity', 'reorder_level']),
        ]
    
    def __str__(self):
        return self.name
    
    def is_low_stock(self):
        """
        Check if ingredient is below reorder level
        """
        return self.quantity <= self.reorder_level
    
    def update_stock(self, quantity_used):
        """
        Update stock and track last used time
        """
        self.quantity -= quantity_used
        self.last_used_at = timezone.now()
        
        if self.is_low_stock():
            # Trigger notification or reorder process
            self.notify_low_stock()
        
        self.save(update_fields=['quantity', 'last_used_at'])
    
    def notify_low_stock(self):
        """
        Placeholder for low stock notification
        Can be extended to send emails, slack messages, etc.
        """
        # TODO: Implement notification system
        pass

class MenuItemIngredient(models.Model):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        db_table = 'menu_item_ingredients'
        unique_together = ('menu_item', 'ingredient')

class InventoryTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('purchase', 'Purchase'),
        ('usage', 'Usage'),
        ('adjustment', 'Adjustment'),
    )
    
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='transactions')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'inventory_transactions'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.ingredient.name} - {self.transaction_type}"

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled')
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'kitchen_orders'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.id} - {self.status}"
    
    def update_status(self, new_status):
        """Update order status and save"""
        self.status = new_status
        self.save(update_fields=['status', 'updated_at'])

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='kitchen_order_items', on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, related_name='kitchen_order_items', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    item_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        db_table = 'kitchen_order_items'
    
    def __str__(self):
        return f"{self.quantity} x {self.menu_item.name}"
    
    def calculate_item_total(self):
        """Calculate total price for this order item"""
        return self.quantity * self.item_price
