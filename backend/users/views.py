from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserSerializer, GuestSessionSerializer
from .models import User, GuestSession
from rest_framework.exceptions import ValidationError

class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response({
                'message': 'User registered successfully',
                'email': serializer.data['email'],
                'username': serializer.data['username'],
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            # Format error messages for frontend
            error_detail = {}
            for field, errors in e.detail.items():
                if isinstance(errors, list):
                    error_detail[field] = errors[0] if errors else ''
                else:
                    error_detail[field] = str(errors)
            
            return Response({
                'error': 'Validation failed',
                'detail': error_detail
            }, status=status.HTTP_400_BAD_REQUEST)

class GuestSessionCreateView(APIView):
    def post(self, request):
        session = GuestSession.objects.create()
        serializer = GuestSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GuestSessionDetailView(APIView):
    def get(self, request, session_id):
        try:
            session = GuestSession.objects.get(session_id=session_id)
            return Response(GuestSessionSerializer(session).data)
        except GuestSession.DoesNotExist:
            return Response({'error': 'Invalid session'}, status=status.HTTP_404_NOT_FOUND)


class GuestSessionTerminateView(APIView):
    def post(self, request, session_id):
        try:
            session = GuestSession.objects.get(session_id=session_id)
            session.delete()
            return Response({'status': 'Session and all related data deleted'})
        except GuestSession.DoesNotExist:
            return Response({'status': 'Invalid session'}, status=status.HTTP_404_NOT_FOUND)