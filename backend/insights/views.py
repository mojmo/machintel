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