from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Note, Category
from .serializers import NoteSerializer, CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class NoteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Note.objects.all().order_by('-pinned', '-updated_at')
    serializer_class = NoteSerializer
