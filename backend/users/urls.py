from django.urls import path
from .views import RegisterView, GuestSessionCreateView, GuestSessionDetailView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('guest-sessions/', GuestSessionCreateView.as_view(), name='guest-session-create'),
    path('guest-sessions/<uuid:session_id>/', GuestSessionDetailView.as_view(), name='guest-session-detail'),
]