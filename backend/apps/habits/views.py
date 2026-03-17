from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Habit, HabitLog
from .serializers import HabitSerializer, HabitLogSerializer
from datetime import date

class HabitViewSet(viewsets.ModelViewSet):
    queryset = Habit.objects.all()
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def toggle_today(self, request, pk=None):
        habit = self.get_object()
        today = date.today()
        
        log, created = HabitLog.objects.get_or_create(
            habit=habit, date=today,
            defaults={'completed': True}
        )
        
        if not created:
            # Si ya existía, lo eliminamos (toggle de completado a no completado)
            log.delete()
        
        # Volver a obtener el hábito para actualizar los campos calculados (streak, rate)
        habit = self.get_object()
        serializer = self.get_serializer(habit)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        habit = self.get_object()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        logs = habit.logs.all()
        if start_date:
            logs = logs.filter(date__gte=start_date)
        if end_date:
            logs = logs.filter(date__lte=end_date)
            
        serializer = HabitLogSerializer(logs, many=True)
        return Response(serializer.data)
