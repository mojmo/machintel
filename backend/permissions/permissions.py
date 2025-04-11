from rest_framework.permissions import BasePermission

class IsAuthenticatedOrGuestSession(BasePermission):
    """
    Custom permission to allow access to authenticated users or valid guest sessions.
    """

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return True


        guest_session_id = request.headers.get('Guest-Session')
        if guest_session_id:
            from users.models import GuestSession
            return GuestSession.objects.filter(session=guest_session_id).exists()

        return False