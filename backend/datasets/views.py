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
class DatasetUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticatedOrGuestSession]

    def post(self, request):
        print("Received files:", request.FILES)  # Debug log
        if 'file' not in request.FILES:
            return Response({"error": "No file provided"}, status=400)

        try:
            file = request.FILES['file']
            print("File attributes:", file.name, file.size, file.content_type)  # Debug

            # Manually construct data for serializer
            data = {'file': file}
            

            serializer = DatasetSerializer(data=data)
            
            if serializer.is_valid():

                if request.user.is_authenticated:
                    # data['user'] = request.user.id
                    instance = serializer.save(user=request.user)
                elif hasattr(request, 'guest_session'):
                    # data['session'] = request.guest_session.session_id
                    instance = serializer.save(session=request.guest_session)
                else:
                    return Response(
                        {"error": "Authentication required"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )

                print("File saved at:", instance.file.path)  # Debug
                print("Dataset id:", instance.id)
                
                # Start async processing
                from ml_model.tasks import process_dataset
                process_dataset.delay(instance.id)
                
                return Response(serializer.data, status=201)
            
            print("Serializer errors:", serializer.errors)  # Debug
            return Response(serializer.errors, status=400)

        except Exception as e:
            print("Exception:", str(e))  # Debug
            return Response({"error": str(e)}, status=500)

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