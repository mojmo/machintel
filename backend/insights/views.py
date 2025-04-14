from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .serializers import InsightSerializer
from .models import Insight


class InsightListView(generics.ListAPIView):
    serializer_class = InsightSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Insight.objects.filter(dataset__user=user)


class InsightDetailView(generics.RetrieveAPIView):
    serializer_class = InsightSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Insight.objects.filter(dataset__user=user)


class DatasetInsightsView(generics.ListAPIView):
    """Get insights for a specific dataset"""
    serializer_class = InsightSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        dataset_id = self.kwargs.get('dataset_id')

        if not dataset_id:
            return Insight.objects.none()

        return Insight.objects.filter(dataset=dataset_id, dataset__user=user)