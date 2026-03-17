from rest_framework import serializers
from .models import BoardColumn, Tag, Event, Subtask

class BoardColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardColumn
        fields = '__all__'

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    subtasks = SubtaskSerializer(many=True, read_only=True)
    tags_details = TagSerializer(source='tags', many=True, read_only=True)

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
