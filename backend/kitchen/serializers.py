from rest_framework import serializers
from .models import MenuItem, Ingredient, MenuItemIngredient, InventoryTransaction
import json
from django.utils import timezone
from django.core.validators import MinValueValidator

class IngredientSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.SerializerMethodField()
    days_since_restock = serializers.SerializerMethodField()
    
    class Meta:
        model = Ingredient
        fields = [
            'id', 'name', 'quantity', 'unit', 'category', 
            'cost_per_unit', 'reorder_level', 'is_perishable', 
            'last_restocked_at', 'last_used_at', 'is_low_stock', 
            'days_since_restock', 'expiration_date'
        ]
        extra_kwargs = {
            'quantity': {'validators': [MinValueValidator(0)]},
            'cost_per_unit': {'validators': [MinValueValidator(0)]},
            'reorder_level': {'validators': [MinValueValidator(0)]}
        }
    
    def get_is_low_stock(self, obj):
        """
        Determine if ingredient is below reorder level
        """
        return obj.quantity <= obj.reorder_level
    
    def get_days_since_restock(self, obj):
        """
        Calculate days since last restock
        """
        if not obj.last_restocked_at:
            return None
        
        return (timezone.now() - obj.last_restocked_at).days
    
    def validate_unit(self, value):
        """
        Validate unit against model's UNIT_CHOICES
        """
        valid_units = [unit[0] for unit in Ingredient.UNIT_CHOICES]
        if value not in valid_units:
            raise serializers.ValidationError(f"{value} is not a valid unit choice.")
        return value
    
    def validate(self, data):
        """
        Additional validation for ingredient data
        """
        # Ensure reorder level is less than total quantity
        if data.get('reorder_level') and data.get('quantity'):
            if data['reorder_level'] > data['quantity']:
                raise serializers.ValidationError({
                    'reorder_level': 'Reorder level cannot be greater than total quantity'
                })
        
        return data
    
    def create(self, validated_data):
        """
        Custom create method to set last_restocked_at
        """
        validated_data['last_restocked_at'] = timezone.now()
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """
        Custom update method to track quantity changes
        """
        old_quantity = instance.quantity
        updated_instance = super().update(instance, validated_data)
        
        # Track quantity increase as restock
        if validated_data.get('quantity', old_quantity) > old_quantity:
            updated_instance.last_restocked_at = timezone.now()
            updated_instance.save(update_fields=['last_restocked_at'])
        
        return updated_instance

class InventoryTransactionSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    
    class Meta:
        model = InventoryTransaction
        fields = '__all__'
        read_only_fields = ('timestamp',)

class MenuItemIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    ingredient_details = IngredientSerializer(source='ingredient', read_only=True)
    
    class Meta:
        model = MenuItemIngredient
        fields = ('id', 'ingredient', 'ingredient_name', 'ingredient_details', 'quantity')

class MenuItemSerializer(serializers.ModelSerializer):
    ingredients = MenuItemIngredientSerializer(source='menuitemingredient_set', many=True, required=False)
    ingredient_availability = serializers.SerializerMethodField()
    
    class Meta:
        model = MenuItem
        fields = ('id', 'name', 'description', 'price', 'category', 
                 'image', 'is_available', 'preparation_time', 
                 'ingredients', 'ingredient_availability')

    def get_ingredient_availability(self, obj):
        """
        Check if all ingredients for a menu item are available
        """
        for menu_item_ingredient in obj.menuitemingredient_set.all():
            ingredient = menu_item_ingredient.ingredient
            if ingredient.quantity < menu_item_ingredient.quantity:
                return False
        return True

    def create(self, validated_data):
        ingredients_data = self.context.get('request').data.getlist('ingredients', [])
        menu_item = MenuItem.objects.create(**validated_data)
        
        for ingredient_data in ingredients_data:
            try:
                ingredient_info = json.loads(ingredient_data)
                MenuItemIngredient.objects.create(
                    menu_item=menu_item,
                    ingredient_id=ingredient_info['ingredient'],
                    quantity=ingredient_info['quantity']
                )
            except (json.JSONDecodeError, KeyError) as e:
                raise serializers.ValidationError(f"Invalid ingredient data format: {str(e)}")
        
        return menu_item

    def update(self, instance, validated_data):
        ingredients_data = self.context.get('request').data.getlist('ingredients', [])
        
        # Update menu item fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Clear existing ingredients
        instance.menuitemingredient_set.all().delete()
        
        # Add new ingredients
        for ingredient_data in ingredients_data:
            try:
                ingredient_info = json.loads(ingredient_data)
                MenuItemIngredient.objects.create(
                    menu_item=instance,
                    ingredient_id=ingredient_info['ingredient'],
                    quantity=ingredient_info['quantity']
                )
            except (json.JSONDecodeError, KeyError) as e:
                raise serializers.ValidationError(f"Invalid ingredient data format: {str(e)}")
        
        return instance
