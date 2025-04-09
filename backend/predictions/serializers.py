from rest_framework import serializers

class PredictionInputSerializer(serializers.Serializer):
    type = serializers.CharField(required=True)
    air_temperature = serializers.FloatField(required=True)
    process_temperature = serializers.FloatField(required=True)
    rotational_speed = serializers.FloatField(required=True)
    torque = serializers.FloatField(required=True)
    tool_wear = serializers.FloatField(required=True)

class ModelInfoSerializer(serializers.Serializer):
    model_version = serializers.CharField()
    last_modified = serializers.IntegerField()
    features = serializers.ListField(child=serializers.CharField())
    status = serializers.CharField()