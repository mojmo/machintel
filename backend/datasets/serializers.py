import csv
import io
from rest_framework import serializers
from .models import Dataset

class DatasetSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Dataset
        fields = '__all__'
        read_only_fields = ['uploaded_at', 'user', 'session']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def validate_file(self, value):
        if not value.name.endswith('.csv'):
            raise serializers.ValidationError("Only CSV files are allowed.")

        try:
            decoded_file = value.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.reader(io_string)
            headers = next(reader)

            required_headers = ['Product ID', 'Type','Air temperature [K]', 'Process temperature [K]', 'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]']
            self.missing_headers = [col for col in required_headers if col not in headers]

            value.seek(0)

        except Exception as e:
            raise serializers.ValidationError(f"Invalid CSV file: {str(e)}")

        return value

    def to_representation(self, instance):  #warning response with missing headers
        rep = super().to_representation(instance)
        missing = getattr(self, 'missing_headers', [])
        if missing:
            rep['warnings'] = [f"Missing column: {col}" for col in missing]
        return rep
