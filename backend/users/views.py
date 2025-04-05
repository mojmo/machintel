from rest_framework import generics
from rest_framework.response import Response
from .serializers import UserSerializer
from .models import User

class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'message': 'User registered successfully',
            'email': serializer.data['email'],
            'username': serializer.data['username'],
        }, status=201)
