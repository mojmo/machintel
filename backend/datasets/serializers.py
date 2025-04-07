import csv
import io
from rest_framework import serializers
from .models import Dataset

class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = '__all__'
        read_only_fields = ['uploaded_at', 'user', 'session_key']

    def validate_file(self, value):
        if not value.name.endswith('.csv'):
            raise serializers.ValidationError("Only CSV files are allowed.")

        try:
            decoded_file = value.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.reader(io_string)
            headers = next(reader)

            required_headers = ['timestamp', 'sensor_value']
            for col in required_headers:
                if col not in headers:
                    raise serializers.ValidationError(f"Missing required column: {col}")

            value.seek(0)  # Rewind file pointer for saving

        except Exception as e:
            raise serializers.ValidationError(f"Invalid CSV file: {str(e)}")

        return value
