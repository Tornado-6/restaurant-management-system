from rest_framework import serializers
from .models import Order, OrderItem, Payment
from kitchen.serializers import MenuItemSerializer
from kitchen.models import MenuItem
from django.utils import timezone

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_details = MenuItemSerializer(source='menu_item', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ('id', 'menu_item', 'menu_item_details', 'quantity', 'price', 'notes')
        extra_kwargs = {
            'price': {'required': False, 'allow_null': True}
        }

    def validate(self, data):
        # If price is not provided, try to get it from menu item
        menu_item = data.get('menu_item')
        if menu_item and ('price' not in data or data['price'] is None):
            # If menu_item is an ID, fetch the actual object
            if isinstance(menu_item, int):
                menu_item = MenuItem.objects.get(id=menu_item)
            
            # Set price from menu item if available
            data['price'] = menu_item.price if hasattr(menu_item, 'price') else 0
        
        return data

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ('id', 'order', 'amount', 'payment_method', 'transaction_id', 'payment_date')
        read_only_fields = ('payment_date',)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)
    payment = PaymentSerializer(read_only=True)
    waiter_name = serializers.CharField(source='waiter.get_full_name', read_only=True)
    chef_name = serializers.CharField(source='chef.get_full_name', read_only=True)
    table_number = serializers.IntegerField(source='table.table_number', read_only=True)
    
    class Meta:
        model = Order
        fields = ('id', 'table', 'table_number', 'waiter', 'waiter_name', 
                 'chef', 'chef_name', 'status', 'priority', 
                 'created_at', 'updated_at', 'started_preparing_at', 'completed_at',
                 'special_instructions', 'is_paid', 'total_amount', 
                 'estimated_preparation_time', 'actual_preparation_time',
                 'items', 'payment')
        read_only_fields = ('created_at', 'updated_at', 'is_paid', 'total_amount',
                            'started_preparing_at', 'completed_at', 
                            'actual_preparation_time')
        extra_kwargs = {
            'status': {'required': False},
            'chef': {'required': False},
            'started_preparing_at': {'required': False},
            'completed_at': {'required': False}
        }

    def validate_status(self, value):
        # Validate status transitions
        if not self.instance:
            return value

        current_status = self.instance.status
        valid_transitions = {
            'pending': ['preparing', 'cancelled'],
            'preparing': ['ready', 'cancelled'],
            'ready': ['served', 'cancelled'],
            'served': [],
            'cancelled': []
        }

        if value not in valid_transitions.get(current_status, []):
            raise serializers.ValidationError(
                f"Cannot transition from {current_status} to {value}"
            )
        
        return value

    def validate(self, data):
        # Additional validation logic
        if 'status' in data:
            # Ensure consistent status transitions
            current_status = self.instance.status if self.instance else None
            new_status = data['status']
            
            # Validate status transition
            valid_transitions = {
                'pending': ['preparing', 'cancelled'],
                'preparing': ['ready', 'cancelled'],
                'ready': ['served', 'cancelled'],
                'served': [],
                'cancelled': []
            }
            
            if current_status and new_status not in valid_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Invalid status transition from {current_status} to {new_status}"
                )
        
        return data

    def update(self, instance, validated_data):
        # Remove items from validated data if present
        validated_data.pop('items', None)
        
        # Update status with additional logic
        if 'status' in validated_data:
            new_status = validated_data['status']
            
            # Set chef for preparing orders
            if new_status == 'preparing':
                validated_data['chef'] = self.context['request'].user
                validated_data['started_preparing_at'] = timezone.now()
            
            # Add timestamp for completed or cancelled orders
            if new_status in ['served', 'cancelled']:
                validated_data['completed_at'] = timezone.now()
        
        return super().update(instance, validated_data)

    def create(self, validated_data):
        # Extract items data from context
        items_data = self.context.get('items', [])
        
        # Log input data for debugging
        print("Validated Order Data:", validated_data)
        print("Order Items Data:", items_data)
        
        # Remove items from validated_data if present
        validated_data.pop('items', None)
        
        # Set total_amount to 0 by default if not provided
        total_amount = validated_data.pop('total_amount', 0)
        
        # Create the order first
        try:
            order = Order.objects.create(total_amount=total_amount, **validated_data)
        except Exception as e:
            print(f"Error creating order: {e}")
            raise
        
        # Then create order items and calculate total
        calculated_total = 0
        order_items = []
        for item_data in items_data:
            menu_item = item_data.get('menu_item')
            quantity = item_data.get('quantity', 1)
            notes = item_data.get('notes', '')
            price = item_data.get('price')
            
            print(f"Processing item: {item_data}")
            
            if menu_item:
                try:
                    # If menu_item is an ID, fetch the actual object
                    if isinstance(menu_item, int):
                        menu_item_obj = MenuItem.objects.get(id=menu_item)
                    else:
                        menu_item_obj = menu_item
                    
                    # If price is not provided, get it from menu item
                    if price is None:
                        price = menu_item_obj.price if hasattr(menu_item_obj, 'price') else 0
                    
                    order_item = OrderItem(
                        order=order,
                        menu_item_id=menu_item if isinstance(menu_item, int) else menu_item.id,
                        quantity=quantity,
                        price=price,
                        notes=notes
                    )
                    order_items.append(order_item)
                    calculated_total += price * quantity
                except Exception as e:
                    print(f"Error processing order item: {e}")
                    raise
        
        # Bulk create order items
        if order_items:
            try:
                OrderItem.objects.bulk_create(order_items)
            except Exception as e:
                print(f"Error bulk creating order items: {e}")
                raise
        
        # Update the order with the calculated total if no total was provided
        if total_amount == 0:
            order.total_amount = calculated_total
            order.save()
        
        return order
