from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import GuestSession


class Command(BaseCommand):

    help = 'Deletes expired guest sessions and their data'

    def handle(self, *args, **options):
        expired_sessions = GuestSession.objects.filter(expires_at__lte=timezone.now())
        count = expired_sessions.count()
        expired_sessions.delete() # Triggers the pre_delete signal
        self.stdout.write(f'Deleted {count} expired sessions')