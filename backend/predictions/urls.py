from django.urls import path
from .views import PredictionList, PredictionDetail

urlpatterns = [
    path('', PredictionList.as_view(), name='prediction-list'),
    path('<int:pk>/', PredictionDetail.as_view(), name='prediction-detail'),
]