from django.urls import path
from .views import InsightListView, InsightDetailView

urlpatterns = [
    path('', InsightListView.as_view(), name='insight-list'),
    path('<int:pk>/', InsightDetailView.as_view(), name='insight-detail'),
]