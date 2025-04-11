from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Prediction
from .serializers import PredictionSerializer
from permissions.permissions import IsAuthenticatedOrGuestSession


class PredictionList(generics.ListAPIView):
    serializer_class = PredictionSerializer
    permission_classes = [IsAuthenticatedOrGuestSession]
    
    def get_queryset(self):
        queryset = Prediction.objects.all()
        dataset_id = self.request.query_params.get('dataset')
        product_id = self.request.query_params.get('product_id')
        
        if dataset_id:
            queryset = queryset.filter(dataset_id=dataset_id)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
            
        return queryset

class PredictionDetail(generics.RetrieveAPIView):
    queryset = Prediction.objects.all()
    serializer_class = PredictionSerializer
    permission_classes = [IsAuthenticatedOrGuestSession]