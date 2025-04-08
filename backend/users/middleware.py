from django.utils import timezone
from .models import GuestSession


class GuestSessionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        session_id = request.headers.get('X-Guest-Session')
        if session_id:
            try:
                request.guest_session = GuestSession.objects.get(
                    session_id=session_id,
                    expires_at__gt=timezone.now()
                )
            except GuestSession.DoesNotExist:
                pass
        return self.get_response(request)