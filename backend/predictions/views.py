from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Prediction
from .serializers import PredictionSerializer
from permissions.permissions import IsAuthenticatedOrGuestSession
from rest_framework.exceptions import PermissionDenied


class PredictionList(generics.ListAPIView):
    serializer_class = PredictionSerializer
    permission_classes = [IsAuthenticatedOrGuestSession]
    
    def get_queryset(self):
        queryset = Prediction.objects.all()
        dataset_id = self.request.query_params.get('dataset')
        product_id = self.request.query_params.get('product_id')
        
        # Filter by dataset ownership
        if self.request.user.is_authenticated:
            # Authenticated user: filter by datasets they own
            queryset = queryset.filter(dataset__user=self.request.user)
        elif hasattr(self.request, 'guest_session'):
            # Guest session: filter by datasets associated with the session
            queryset = queryset.filter(dataset__session=self.request.guest_session)
        else:
            raise PermissionDenied("You are not authorized to view these predictions.")

        if dataset_id:
            queryset = queryset.filter(dataset_id=dataset_id)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
            
        return queryset

class PredictionDetail(generics.RetrieveAPIView):
    queryset = Prediction.objects.all()
    serializer_class = PredictionSerializer
    permission_classes = [IsAuthenticatedOrGuestSession]

    def get_queryset(self):
        queryset = Prediction.objects.all()

        # Filter by dataset ownership
        if self.request.user.is_authenticated:
            queryset = queryset.filter(dataset__user=self.request.user)
        elif hasattr(self.request, 'guest_session'):
            queryset = queryset.filter(dataset__session=self.request.guest_session)
        else:
            raise PermissionDenied("You are not authorized to view this prediction.")

        return queryset