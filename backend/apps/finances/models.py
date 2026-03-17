from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

class Category(models.Model):
    class TypeChoices(models.TextChoices):
        INCOME = 'INCOME', 'Income'
        EXPENSE = 'EXPENSE', 'Expense'

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=TypeChoices.choices)
    color = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

    class Meta:
        verbose_name_plural = "Categories"

class Transaction(models.Model):
    class TypeChoices(models.TextChoices):
        INCOME = 'INCOME', 'Income'
        EXPENSE = 'EXPENSE', 'Expense'

    class RecurrencePeriodChoices(models.TextChoices):
        WEEKLY = 'WEEKLY', 'Weekly'
        MONTHLY = 'MONTHLY', 'Monthly'

    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    type = models.CharField(max_length=10, choices=TypeChoices.choices)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    date = models.DateField()
    
    # Recurrence fields
    is_recurring = models.BooleanField(default=False)
    recurrence_period = models.CharField(max_length=10, choices=RecurrencePeriodChoices.choices, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.amount} ({self.date})"
        
    class Meta:
        ordering = ['-date', '-created_at']

class RecurrenceLog(models.Model):
    """
    Keeps track of the periods we have already processed to avoid 
    creating duplicate recurring transactions.
    """
    period_key = models.CharField(max_length=50, unique=True, help_text="Format: YYYY-MM for monthly, YYYY-Www for weekly")
    processed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Processed period: {self.period_key}"
