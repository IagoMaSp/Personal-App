from django.db import models

class Habit(models.Model):
    name = models.CharField(max_length=200)
    icon = models.CharField(max_length=50, blank=True, null=True)  # Lucide icon key
    color = models.CharField(max_length=50, default='#6b8ea5')
    frequency = models.CharField(
        max_length=20,
        choices=[('daily', 'Daily'), ('weekly', 'Weekly')],
        default='daily'
    )
    target_days = models.JSONField(default=list)  # [0,1,2,3,4] = Lun-Vie
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

class HabitLog(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField()
    completed = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('habit', 'date')
        ordering = ['-date']
