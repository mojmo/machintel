from django.urls import path
from .views import DatasetUploadView, UserDatasetListView, UserDatasetDetailView

urlpatterns = [
    path('upload/', DatasetUploadView.as_view(), name='dataset-upload'),
    path('my/', UserDatasetListView.as_view(), name='my-datasets'),
    path('my/<int:pk>/', UserDatasetDetailView.as_view(), name='my-dataset-detail'),
]
