from rest_framework import viewsets
from .models import Event
from .serializers import EventSerializer
import datetime

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    def get_queryset(self):
        """
        Optionally restricts the returned events to a given year and month,
        by filtering against `year` and `month` query parameters in the URL.
        """
        queryset = Event.objects.all()
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        
        if year is not None and month is not None:
            queryset = queryset.filter(date__year=year, date__month=month)
        return queryset
