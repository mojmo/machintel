from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Dataset
from .serializers import DatasetSerializer
from users.models import GuestSession
from datasets.permissions import IsAuthenticatedOrGuestSession
from rest_framework.permissions import IsAuthenticated
class DatasetUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticatedOrGuestSession]

    def post(self, request):
        serializer = DatasetSerializer(data=request.data)
        if serializer.is_valid():

            if request.user.is_authenticated:
                serializer.save(user=request.user)
            elif hasattr(request, 'guest_session'):
                serializer.save(session=request.guest_session)
            else:
                return Response(
                    {"error": "Authentication required"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDatasetListView(generics.ListAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Dataset.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}


class UserDatasetDetailView(generics.RetrieveAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Dataset.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}