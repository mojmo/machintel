from django.contrib.auth.backends import BaseBackend
from .models import GuestSession


class GuestSessionBackend(BaseBackend):
    def authenticate(self, request, session_id=None):
        try:
            return GuestSession.objects.get(session_id=session_id)
        except GuestSession.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return GuestSession.objects.get(pk=user_id)
        except GuestSession.DoesNotExist:
            return None