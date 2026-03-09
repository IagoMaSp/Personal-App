from django.db import models

class Schedule(models.Model):
    DAY_CHOICES = [
        (0, 'Lunes'),
        (1, 'Martes'),
        (2, 'Miércoles'),
        (3, 'Jueves'),
        (4, 'Viernes'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    color = models.CharField(max_length=50, default='bg-hk-accent')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_day_of_week_display()} {self.start_time}-{self.end_time})"

    class Meta:
        ordering = ['day_of_week', 'start_time']
