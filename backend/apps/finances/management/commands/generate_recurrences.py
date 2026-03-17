"""
Management command to generate recurring transactions.
Run this command periodically via cron to automate recurring finances.

Cron example (runs every day at 08:00 AM):
0 8 * * * python manage.py generate_recurrences
"""

import logging
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from apps.finances.models import Transaction, RecurrenceLog

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Generates recurring transactions for the current period'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Iniciando generación de recurrencias..."))
        try:
            self._generate_recurrences()
            self.stdout.write(self.style.SUCCESS('Recurrencias comprobadas y generadas con éxito.'))
        except Exception as e:
            logger.error(f"Error generating recurrences: {str(e)}")
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))

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
            self.stdout.write(self.style.SUCCESS(f"Lote de recurrencias mensuales procesado: {monthly_key}."))
            
        # 2. Process Weekly Recurrences
        iso_year, iso_week, _ = today.isocalendar()
        weekly_key = f"{iso_year}-W{iso_week:02d}"
        if not RecurrenceLog.objects.filter(period_key=weekly_key).exists():
            self._process_weekly_recurrences(today)
            RecurrenceLog.objects.create(period_key=weekly_key)
            self.stdout.write(self.style.SUCCESS(f"Lote de recurrencias semanales procesado: {weekly_key}."))

    def _process_monthly_recurrences(self, today):
        monthly_templates = Transaction.objects.filter(
            is_recurring=True, 
            recurrence_period=Transaction.RecurrencePeriodChoices.MONTHLY
        )
        
        templates_dict = {}
        for tx in monthly_templates:
            key = (tx.title, tx.amount, tx.category_id, tx.type)
            if key not in templates_dict or tx.date > templates_dict[key].date:
                templates_dict[key] = tx
                
        for key, tx in templates_dict.items():
            if tx.date.year != today.year or tx.date.month != today.month:
                new_date = today.replace(day=min(tx.date.day, 28))
                Transaction.objects.create(
                    title=tx.title,
                    amount=tx.amount,
                    type=tx.type,
                    category=tx.category,
                    date=new_date,
                    is_recurring=False,
                    recurrence_period=None
                )

    def _process_weekly_recurrences(self, today):
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
                days_ahead = tx.date.weekday() - today.weekday()
                new_date = today + timedelta(days=days_ahead)
                
                Transaction.objects.create(
                    title=tx.title,
                    amount=tx.amount,
                    type=tx.type,
                    category=tx.category,
                    date=new_date,
                    is_recurring=False,
                    recurrence_period=None
                )
