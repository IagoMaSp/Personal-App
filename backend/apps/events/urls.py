from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BoardColumnViewSet, TagViewSet, EventViewSet, SubtaskViewSet

router = DefaultRouter()
router.register(r'columns', BoardColumnViewSet, basename='column')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'events', EventViewSet, basename='event')
router.register(r'subtasks', SubtaskViewSet, basename='subtask')

urlpatterns = [
    path('', include(router.urls)),
]
