from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import date, timedelta
from .models import Category, Transaction, RecurrenceLog
from .serializers import CategorySerializer, TransactionSerializer
import logging

logger = logging.getLogger(__name__)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by('-date', '-created_at')
    serializer_class = TransactionSerializer

    def list(self, request, *args, **kwargs):
        """
        Overriding the list method to automatically trigger recurrence generation 
        before returning the transactions.
        """
        try:
            self._generate_recurrences()
        except Exception as e:
            logger.error(f"Error generating recurrences: {str(e)}")
            
        return super().list(request, *args, **kwargs)

    def _generate_recurrences(self):
        """
        Checks if we need to generate recurring transactions for the current period.
        """
        today = date.today()
        
        # 1. Process Monthly Recurrences
        monthly_key = f"{today.year}-{today.month:02d}"
        if not RecurrenceLog.objects.filter(period_key=monthly_key).exists():
            self._process_monthly_recurrences(today)
            RecurrenceLog.objects.create(period_key=monthly_key)
            
        # 2. Process Weekly Recurrences
        # Get ISO calendar week (year, week_number, weekday)
        iso_year, iso_week, _ = today.isocalendar()
        weekly_key = f"{iso_year}-W{iso_week:02d}"
        if not RecurrenceLog.objects.filter(period_key=weekly_key).exists():
            self._process_weekly_recurrences(today)
            RecurrenceLog.objects.create(period_key=weekly_key)

    def _process_monthly_recurrences(self, today):
        """
        Finds all active recurring 'MONTHLY' transactions and duplicates them 
        for the current month if they belong to a past month.
        """
        # Get base template for monthly transactions (we just take the most recent one for each recurring series)
        # Note: In a more complex app, we'd have a separate `RecurringProfile` model, 
        # but here we just find recent 'is_recurring=True' & 'recurrence_period=MONTHLY' 
        # and duplicate them. To avoid duplicating twice, we only duplicate if the transaction's 
        # month is not the current month.
        
        # Find the latest distinct monthly recurring transactions
        # We can just check all monthly recurring transactions created before this month.
        # But we must only copy them ONCE per month. The RecurrenceLog handles the "once per month" part.
        
        monthly_templates = Transaction.objects.filter(
            is_recurring=True, 
            recurrence_period=Transaction.RecurrencePeriodChoices.MONTHLY
        )
        
        # We need to find the "base" transactions to duplicate.
        # To avoid explosive growth if this logic is flawed, we'll only duplicate those that are from previous months
        # AND we haven't already created one for this month (which is theoretically covered by RecurrenceLog).
        
        # We will keep a set of (title, amount, category_id) to avoid creating duplicates of the SAME recurring template
        # if the user manually created multiple. We take the latest.
        
        templates_dict = {}
        for tx in monthly_templates:
            key = (tx.title, tx.amount, tx.category_id, tx.type)
            if key not in templates_dict or tx.date > templates_dict[key].date:
                templates_dict[key] = tx
                
        for key, tx in templates_dict.items():
            # If the template's date is not in the current month/year, create a new one
            if tx.date.year != today.year or tx.date.month != today.month:
                new_date = today.replace(day=min(tx.date.day, 28)) # rudimentary end-of-month handling
                Transaction.objects.create(
                    title=tx.title,
                    amount=tx.amount,
                    type=tx.type,
                    category=tx.category,
                    date=new_date,
                    is_recurring=False, # The duplicate shouldn't ALSO duplicate
                    recurrence_period=None
                )

    def _process_weekly_recurrences(self, today):
        """
        Similar logic for WEEKLY recurrences.
        """
        weekly_templates = Transaction.objects.filter(
            is_recurring=True, 
            recurrence_period=Transaction.RecurrencePeriodChoices.WEEKLY
        )
        
        templates_dict = {}
        iso_year, iso_week, _ = today.isocalendar()
        
        for tx in weekly_templates:
            key = (tx.title, tx.amount, tx.category_id, tx.type)
            if key not in templates_dict or tx.date > templates_dict[key].date:
                templates_dict[key] = tx
                
        for key, tx in templates_dict.items():
            tx_iso_year, tx_iso_week, _ = tx.date.isocalendar()
            if tx_iso_year != iso_year or tx_iso_week != iso_week:
                # Calculate the same day of the week for the current week
                days_ahead = tx.date.weekday() - today.weekday()
                new_date = today + timedelta(days=days_ahead)
                
                Transaction.objects.create(
                    title=tx.title,
                    amount=tx.amount,
                    type=tx.type,
                    category=tx.category,
                    date=new_date,
                    is_recurring=False, # The duplicate shouldn't ALSO duplicate
                    recurrence_period=None
                )
