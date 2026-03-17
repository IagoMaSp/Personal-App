from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import BoardColumn, Tag, Event, Subtask
from .serializers import BoardColumnSerializer, TagSerializer, EventSerializer, SubtaskSerializer
import datetime

class BoardColumnViewSet(viewsets.ModelViewSet):
    queryset = BoardColumn.objects.all()
    serializer_class = BoardColumnSerializer

    @action(detail=False, methods=['post'])
    def update_order(self, request):
        """
        Receives a list of columns with their new orders
        [{"id": 1, "order": 0}, {"id": 2, "order": 1}]
        """
        orders = request.data
        for item in orders:
            BoardColumn.objects.filter(id=item.get('id')).update(order=item.get('order'))
        return Response({'status': 'order updated'})

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class SubtaskViewSet(viewsets.ModelViewSet):
    queryset = Subtask.objects.all()
    serializer_class = SubtaskSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    def get_queryset(self):
        """
        Optionally restricts the returned events to a given year and month.
        """
        queryset = Event.objects.all()
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        
        if year is not None and month is not None:
            queryset = queryset.filter(date__year=year, date__month=month)
        return queryset

    @action(detail=False, methods=['post'])
    def update_order(self, request):
        """
        Receives a list of events to update their column and local order:
        [{"id": 1, "column": 2, "order": 0}, ...]
        """
        orders = request.data
        for item in orders:
            Event.objects.filter(id=item.get('id')).update(
                column_id=item.get('column'),
                order=item.get('order')
            )
        return Response({'status': 'order updated'})
