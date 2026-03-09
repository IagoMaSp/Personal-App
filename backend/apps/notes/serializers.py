from rest_framework import serializers
from .models import Note, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'color']

class NoteSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True, 
        queryset=Category.objects.all(), 
        source='categories',
        required=False
    )

    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'icon', 'created_at', 'updated_at', 'pinned', 'categories', 'category_ids']
