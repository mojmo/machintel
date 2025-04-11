from rest_framework.permissions import BasePermission

class IsAuthenticatedOrGuestSession(BasePermission):
    """
    Custom permission to allow access to authenticated users or valid guest sessions.
    """

    def has_permission(self, request, view):
        return bool(
            (request.user and request.user.is_authenticated) or
            hasattr(request, 'guest_session')
        )