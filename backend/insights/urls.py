from django.urls import path
from .views import InsightListView, InsightDetailView, DatasetInsightsView

urlpatterns = [
    path('', InsightListView.as_view(), name='insight-list'),
    path('<int:pk>/', InsightDetailView.as_view(), name='insight-detail'),
    path('dataset/<int:dataset_id>/', DatasetInsightsView.as_view(), name='dataset-insights'),
]