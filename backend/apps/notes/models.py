from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.name

class Note(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True) # Will store TipTap rich text HTML/JSON
    icon = models.CharField(max_length=50, blank=True, null=True)  # Lucide icon name
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    pinned = models.BooleanField(default=False)
    categories = models.ManyToManyField(Category, related_name='notes', blank=True)

    def __str__(self):
        return self.title

