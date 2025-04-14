import csv
import io
from rest_framework import serializers
from .models import Dataset
import pandas as pd

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
            # Quick validation without consuming the file
            if hasattr(value, 'temporary_file_path'):
                pd.read_csv(value.temporary_file_path(), nrows=1)
            else:
                pd.read_csv(value, nrows=1)
            value.seek(0)
        except Exception as e:
            raise serializers.ValidationError(f"Invalid CSV: {str(e)}")
        
        return value

    def to_representation(self, instance):  #warning response with missing headers
        rep = super().to_representation(instance)
        missing = getattr(self, 'missing_headers', [])
        if missing:
            rep['warnings'] = [f"Missing column: {col}" for col in missing]
        return rep


class DatasetWithDataSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    csv_data = serializers.SerializerMethodField()

    class Meta:
        model = Dataset
        fields = ['id', 'file', 'file_url', 'uploaded_at', 'csv_data']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_csv_data(self, obj):
        try:
            df = pd.read_csv(obj.file.path) # Limit rows for preview
            return df.to_dict(orient='records')
        except:
            print("Error reading csv data")
        return None