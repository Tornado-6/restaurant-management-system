from rest_framework import serializers
from .models import Table, Reservation

class TableSerializer(serializers.ModelSerializer):
    def validate_table_number(self, value):
        if value <= 0:
            raise serializers.ValidationError("Table number must be greater than 0")
        
        # Check uniqueness only on creation or if table_number changed
        if self.instance is None or self.instance.table_number != value:
            if Table.objects.filter(table_number=value).exists():
                raise serializers.ValidationError("A table with this number already exists")
        return value

    def validate_capacity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Capacity must be greater than 0")
        return value

    class Meta:
        model = Table
        fields = ('id', 'table_number', 'capacity', 'status', 'location')

class ReservationSerializer(serializers.ModelSerializer):
    table_number = serializers.IntegerField(source='table.table_number', read_only=True)
    
    class Meta:
        model = Reservation
        fields = ('id', 'table', 'table_number', 'customer_name', 'customer_phone',
                 'customer_email', 'party_size', 'reservation_date', 'reservation_time',
                 'status', 'created_at', 'notes')
        read_only_fields = ('created_at',)

    def validate(self, data):
        # Check if table capacity is sufficient
        if data['table'].capacity < data['party_size']:
            raise serializers.ValidationError(
                "Table capacity is not sufficient for the party size"
            )
        
        # Check if table is available for the requested time
        conflicting_reservations = Reservation.objects.filter(
            table=data['table'],
            reservation_date=data['reservation_date'],
            reservation_time=data['reservation_time'],
            status='confirmed'
        )
        
        if self.instance:
            conflicting_reservations = conflicting_reservations.exclude(pk=self.instance.pk)
        
        if conflicting_reservations.exists():
            raise serializers.ValidationError(
                "Table is already reserved for this time"
            )
            
        return data
