from rest_framework import serializers
from .models import User, GuestSession


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class GuestSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuestSession
        fields = ['session_id', 'created_at', 'expires_at']