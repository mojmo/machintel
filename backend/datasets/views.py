from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, Http404
from .models import Dataset
from .serializers import DatasetSerializer
from users.models import GuestSession
from datasets.permissions import IsAuthenticatedOrGuestSession

class DatasetUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticatedOrGuestSession]

    def post(self, request):
        serializer = DatasetSerializer (data=request.data, context={'request': request})

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

class DatasetListView(ListAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [IsAuthenticatedOrGuestSession]

    def get_queryset(self):
        user = self.request.user
        session_key = self.request.guest_session

        if user.is_authenticated:
            return Dataset.objects.filter(user=user)
        return Dataset.objects.filter(user__isnull=True, session_key=session_key)

    def get_serializer_context(self):
        return {'request': self.request}


class DatasetDetailView(RetrieveAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [IsAuthenticatedOrGuestSession]

    def get_queryset(self):
        user = self.request.user
        session_key = self.request.guest_session

        if user.is_authenticated:
            return Dataset.objects.filter(user=user)
        return Dataset.objects.filter(user__isnull=True, session_key=session_key)

    def get_serializer_context(self):
        return {'request': self.request}
    


class DatasetDownloadView(APIView):
    permission_classes = [IsAuthenticatedOrGuestSession]

    def get(self, request, pk):
        user = request.user
        session_key = request.session.guest_session 
        try:
            if user.is_authenticated:
                dataset = Dataset.objects.get(pk=pk, user=user)
            else:
                dataset = Dataset.objects.get(pk=pk, user__isnull=True, session_key=session_key)

            file_handle = dataset.file.open()
            return FileResponse(file_handle, as_attachment=True, filename=dataset.file.name.split('/')[-1])

        except Dataset.DoesNotExist:
            raise Http404("Dataset not found or access denied.")   