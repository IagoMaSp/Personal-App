from rest_framework import serializers
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'

    def validate(self, data):
        """
        Check that start_time is before end_time if both are provided.
        """
        if 'start_time' in data and 'end_time' in data:
            if data['start_time'] and data['end_time'] and data['start_time'] >= data['end_time']:
                raise serializers.ValidationError("End time must be after start time.")
        return data
