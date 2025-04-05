# users/tasks.py
from celery import shared_task
from django.utils import timezone
from .models import GuestSession

@shared_task
def cleanup_expired_sessions():
    expired = GuestSession.objects.filter(expires_at__lte=timezone.now())
    count = expired.count()
    expired.delete()
    return f"Deleted {count} expired sessions"