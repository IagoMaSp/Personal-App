from django.db import models

class Book(models.Model):
    STATUS_CHOICES = [
        ('to_read', 'Por Leer'),
        ('reading', 'Leyendo'),
        ('read', 'Leído'),
        ('dropped', 'Abandonado'),
    ]

    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200, blank=True)
    cover_image = models.ImageField(upload_to='book_covers/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='to_read')
    rating = models.FloatField(default=0.0)
    synopsis = models.TextField(blank=True)
    review = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.author}"
