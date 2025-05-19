from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
            data.update({
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email
            })
            return data
        except Exception as e:
            raise serializers.ValidationError({'detail': 'Invalid credentials. Please check your email and password.'})