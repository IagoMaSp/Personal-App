from rest_framework import serializers
from .models import Habit, HabitLog
from datetime import date, timedelta

class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = '__all__'

class HabitSerializer(serializers.ModelSerializer):
    current_streak = serializers.SerializerMethodField()
    completion_rate_30d = serializers.SerializerMethodField()
    completed_today = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = '__all__'

    def get_completed_today(self, obj):
        return obj.logs.filter(date=date.today(), completed=True).exists()

    def get_current_streak(self, obj):
        target_days = obj.target_days
        if not target_days:
            return 0
            
        log_dates = set(obj.logs.filter(completed=True).values_list('date', flat=True))
        current_date = date.today()
        streak = 0
        
        # Check today
        if current_date.weekday() in target_days:
            if current_date in log_dates:
                streak += 1
        
        # Move to yesterday
        current_date -= timedelta(days=1)
        
        while True:
            # Skip days that are not target days
            if current_date.weekday() not in target_days:
                current_date -= timedelta(days=1)
                continue
                
            if current_date in log_dates:
                streak += 1
                current_date -= timedelta(days=1)
            else:
                break
                
        return streak

    def get_completion_rate_30d(self, obj):
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)
        logs = obj.logs.filter(date__gt=thirty_days_ago, date__lte=today)
        
        target_days = obj.target_days
        if not target_days:
            return 0
            
        target_days_count = 0
        # Check the last 30 days (excluding today, or including today? Usually last 30 days includes today)
        for i in range(30):
            d = today - timedelta(days=i)
            if d.weekday() in target_days:
                target_days_count += 1
                
        if target_days_count == 0:
            return 0
            
        completed_count = logs.filter(completed=True).count()
        return round((completed_count / target_days_count) * 100)
