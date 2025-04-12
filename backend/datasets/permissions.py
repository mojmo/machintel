from rest_framework.permissions import BasePermission
from users.models import GuestSession

class IsAuthenticatedOrGuestSession(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated or
            hasattr(request, 'guest_session')
        )