from rest_framework import generics
from rest_framework.response import Response
from .serializers import UserSerializer
from .models import User

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
