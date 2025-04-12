from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.parsers import MultiPartParser, FormParser
from config.celery import app

from .models import Dataset
from .serializers import DatasetSerializer
from users.models import GuestSession
from predictions.models import Prediction
from .serializers import DatasetWithDataSerializer
from datasets.permissions import IsAuthenticatedOrGuestSession
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
class DatasetUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticatedOrGuestSession]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file = request.FILES['file']
            data = {'file': file}

            serializer = DatasetSerializer(data=data)
            if serializer.is_valid():
                # Save dataset
                if request.user.is_authenticated:
                    instance = serializer.save(user=request.user)
                elif hasattr(request, 'guest_session'):
                    instance = serializer.save(session=request.guest_session)
                else:
                    return Response(
                        {"error": "Authentication required"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )

                # Generate predictions
                from ml_model.tasks import process_dataset
                try:
                    process_dataset.delay(instance.id)
                except Exception as e:
                    raise Exception("Failed to generate predictions.")

                # Generate insights
                from insights.utils import generate_insight
                try:
                    generate_insight(instance.id, instance.file.path)
                except Exception as e:
                    raise Exception(f"Failed to generate insights: {str(e)}")

                return Response(serializer.data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserDatasetListView(generics.ListAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [IsAuthenticatedOrGuestSession]

    def get_queryset(self):
        user = self.request.user
        session_key = getattr(self.request, 'guest_session', None)
        if user.is_authenticated:
            return Dataset.objects.filter(user=user)
        return Dataset.objects.filter(user__isnull=True, session_key=session_key)


    def get_serializer_context(self):
        return {'request': self.request}


class UserDatasetDetailView(generics.RetrieveAPIView):
    serializer_class = DatasetWithDataSerializer
    permission_classes = [IsAuthenticatedOrGuestSession]

    def get_queryset(self):
        user = self.request.user
        session_key = getattr(self.request, 'guest_session', None)

        try:
            if user.is_authenticated:
                return Dataset.objects.filter(user=user)
            return Dataset.objects.filter(user__isnull=True, session_key=session_key)
        except Exception as e:
            print(f"Error retrieving datasets: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_serializer_context(self):
        return {'request': self.request}