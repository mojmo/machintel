import os
from celery import Celery
from django.conf import settings
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
app = Celery('config')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

app.conf.beat_schedule = {
    'cleanup-guest-sessions': {
        'task': 'users.tasks.cleanup_expired_sessions',
        'schedule': crontab(hour=12, minute=14) # Daily at 3 AM
    }
}