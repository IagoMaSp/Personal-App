from django.db import models

class BoardColumn(models.Model):
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=50, default='#333333')
    order = models.IntegerField(default=0)
    wip_limit = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=50, default='bg-hk-accent')
    
    def __str__(self):
        return self.name

class Event(models.Model):
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High')
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_all_day = models.BooleanField(default=False)
    color = models.CharField(max_length=50, default='bg-hk-accent')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Kanban fields
    column = models.ForeignKey(BoardColumn, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    order = models.IntegerField(default=0)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    tags = models.ManyToManyField(Tag, blank=True, related_name='events')

    def __str__(self):
        return f"{self.title} ({self.date})"

    class Meta:
        ordering = ['column__order', 'order', 'date', 'start_time']

class Subtask(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=200)
    is_completed = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title
