import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.events.models import BoardColumn, Event

def run():
    columns = [
        {"name": "To Do", "order": 0, "wip_limit": 0},
        {"name": "In Progress", "order": 1, "wip_limit": 3},
        {"name": "Done", "order": 2, "wip_limit": 0},
    ]

    col_objs = []
    for col_data in columns:
        col, created = BoardColumn.objects.get_or_create(name=col_data['name'], defaults={'order': col_data['order'], 'wip_limit': col_data['wip_limit']})
        col_objs.append(col)
        print(f"Column '{col.name}' exists/created.")

    first_col = col_objs[0]

    events_to_update = Event.objects.filter(column__isnull=True)
    count = events_to_update.count()
    events_to_update.update(column=first_col)
    print(f"Moved {count} existing events to '{first_col.name}'.")

if __name__ == '__main__':
    run()
