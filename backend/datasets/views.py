from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.parsers import MultiPartParser, FormParser
from config.celery import app

from .models import Dataset
from .serializers import DatasetSerializer
from users.models import GuestSession
from predictions.models import Prediction
from .serializers import DatasetWithDataSerializer
from datasets.permissions import IsAuthenticatedOrGuestSession
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
import numpy as np
import pandas as pd
from rest_framework.decorators import api_view, permission_classes
class DatasetUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticatedOrGuestSession]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file = request.FILES['file']
            data = {'file': file}

            serializer = DatasetSerializer(data=data)
            if serializer.is_valid():
                # Save dataset with processing status
                if request.user.is_authenticated:
                    instance = serializer.save(user=request.user, status='processing')
                elif hasattr(request, 'guest_session'):
                    instance = serializer.save(session=request.guest_session, status='processing')
                else:
                    return Response(
                        {"error": "Authentication required"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )

                # Generate predictions
                from ml_model.tasks import process_dataset
                try:
                    process_dataset.delay(instance.id)
                except Exception as e:
                    # Update dataset status to error
                    instance.status = 'error'
                    instance.error_message = "Failed to start prediction processing"
                    instance.save()
                    raise Exception("Failed to generate predictions.")

                # Generate insights
                from insights.utils import generate_insight
                try:
                    generate_insight(instance.id, instance.file.path)
                except Exception as e:
                    raise Exception(f"Failed to generate insights: {str(e)}")

                return Response(serializer.data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserDatasetListView(generics.ListAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [IsAuthenticatedOrGuestSession]

    def get_queryset(self):
        user = self.request.user
        session_key = getattr(self.request, 'guest_session', None)
        if user.is_authenticated:
            return Dataset.objects.filter(user=user)
        return Dataset.objects.filter(user__isnull=True, session=session_key)


    def get_serializer_context(self):
        return {'request': self.request}


class UserDatasetDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DatasetWithDataSerializer
    permission_classes = [IsAuthenticatedOrGuestSession]

    def get_queryset(self):
        user = self.request.user
        session_key = getattr(self.request, 'guest_session', None)

        try:
            if user.is_authenticated:
                return Dataset.objects.filter(user=user)
            return Dataset.objects.filter(user__isnull=True, session=session_key)
        except Exception as e:
            print(f"Error retrieving datasets: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_serializer_context(self):
        return {'request': self.request}
    
    def perform_destroy(self, instance):
        # Delete associated predictions if there are any
        Prediction.objects.filter(dataset=instance).delete()
        # Delete the dataset
        instance.delete()


import numpy as np
import pandas as pd
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

# Add this view function at the end of the file
@api_view(['GET'])
@permission_classes([IsAuthenticatedOrGuestSession])
def dataset_stats(request, pk):
    """Get detailed statistics for a dataset"""
    try:
        # Get the dataset, checking permissions
        user = request.user
        session_key = getattr(request, 'guest_session', None)
        
        if user.is_authenticated:
            dataset = Dataset.objects.get(pk=pk, user=user)
        else:
            dataset = Dataset.objects.get(pk=pk, user__isnull=True, session=session_key)
        
        # Read the dataset
        try:
            df = pd.read_csv(dataset.file.path)
        except Exception as e:
            return Response({"error": f"Failed to read dataset file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Basic dataset info
        basic_stats = {
            'rows': len(df),
            'columns': len(df.columns),
            'file_size': dataset.file.size,
        }
        
        # Identify common column names for better compatibility with different datasets
        column_mappings = {
            'air_temperature': ['Air temperature [K]', 'air_temperature', 'air_temp'],
            'process_temperature': ['Process temperature [K]', 'process_temperature', 'process_temp'],
            'rotational_speed': ['Rotational speed [rpm]', 'rotational_speed', 'speed'],
            'torque': ['Torque [Nm]', 'torque'],
            'tool_wear': ['Tool wear [min]', 'tool_wear'],
            'product_id': ['Product ID', 'product_id'],
            'type': ['Type', 'type', 'machine_type'],
            'machine_id': ['UDI', 'machine_id', 'id']
        }
        
        # Find actual column names in the dataframe
        found_columns = {}
        for key, possible_names in column_mappings.items():
            for name in possible_names:
                if name in df.columns:
                    found_columns[key] = name
                    break
        
        # Calculate statistics based on found columns
        stats = {}
        
        # Get machine counts
        if 'machine_id' in found_columns:
            stats['machineCount'] = df[found_columns['machine_id']].nunique()
        else:
            stats['machineCount'] = 'N/A'
            
        # Get type counts if type column exists
        if 'type' in found_columns:
            stats['type_counts'] = df[found_columns['type']].value_counts().to_dict()
            
            # Get counts by product ID and type if both exist
            if 'product_id' in found_columns:
                type_product_counts = df.groupby([found_columns['type'], found_columns['product_id']]).size().unstack(fill_value=0)
                stats['type_product_counts'] = {
                    type_name: type_group.to_dict() 
                    for type_name, type_group in type_product_counts.iterrows()
                }
        
        # Calculate averages for numerical columns
        numerical_stats = {}
        for stat_name, column_key in [
            ('avgAirTemperature', 'air_temperature'),
            ('avgProcessTemperature', 'process_temperature'),
            ('avgTorque', 'torque'),
            ('avgToolWear', 'tool_wear'),
            ('avgRotationalSpeed', 'rotational_speed')
        ]:
            if column_key in found_columns:
                try:
                    numerical_stats[stat_name] = round(df[found_columns[column_key]].mean(), 2)
                except:
                    numerical_stats[stat_name] = 'N/A'
            else:
                numerical_stats[stat_name] = 'N/A'
                
        stats.update(numerical_stats)
        
        # Create histograms for key numerical columns
        if 'air_temperature' in found_columns:
            try:
                hist_air, bins_air = np.histogram(df[found_columns['air_temperature']].dropna(), bins=10)
                stats['air_temp_histogram'] = {
                    'counts': hist_air.tolist(),
                    'bins': [round(x, 2) for x in bins_air.tolist()]
                }
            except:
                pass
                
        if 'process_temperature' in found_columns:
            try:
                hist_process, bins_process = np.histogram(df[found_columns['process_temperature']].dropna(), bins=10)
                stats['process_temp_histogram'] = {
                    'counts': hist_process.tolist(),
                    'bins': [round(x, 2) for x in bins_process.tolist()]
                }
            except:
                pass

        # Add new aggregated data for scatter plots
        
        # 1. Rotational speed vs torque by product
        if 'rotational_speed' in found_columns and 'torque' in found_columns:
            try:
                speed_torque_df = df.groupby(found_columns['product_id']).agg({
                    found_columns['rotational_speed']: 'mean',
                    found_columns['torque']: 'mean'
                }).reset_index()
                
                stats['speed_torque_data'] = speed_torque_df.to_dict(orient='records')
            except:
                pass
        
        # 2. Air temp vs process temp by product ID and type
        if all(key in found_columns for key in ['air_temperature', 'process_temperature', 'product_id', 'type']):
            try:
                temp_by_product_type = df.groupby([found_columns['product_id'], found_columns['type']]).agg({
                    found_columns['air_temperature']: 'sum',
                    found_columns['process_temperature']: 'sum'
                }).reset_index()
                
                # Rename columns for clarity in the frontend
                temp_by_product_type = temp_by_product_type.rename(columns={
                    found_columns['product_id']: 'product_id',
                    found_columns['type']: 'type',
                    found_columns['air_temperature']: 'air_temp_sum',
                    found_columns['process_temperature']: 'process_temp_sum'
                })
                
                stats['temp_by_product_type'] = temp_by_product_type.to_dict(orient='records')
            except Exception as e:
                print(f"Error creating temp_by_product_type: {str(e)}")
                pass
        
        # 3. Process temp vs rotational speed by product ID and type
        if all(key in found_columns for key in ['process_temperature', 'rotational_speed', 'product_id', 'type']):
            try:
                process_speed_by_product_type = df.groupby([found_columns['product_id'], found_columns['type']]).agg({
                    found_columns['process_temperature']: 'sum',
                    found_columns['rotational_speed']: 'sum'
                }).reset_index()
                
                # Rename columns for clarity in the frontend
                process_speed_by_product_type = process_speed_by_product_type.rename(columns={
                    found_columns['product_id']: 'product_id',
                    found_columns['type']: 'type',
                    found_columns['process_temperature']: 'process_temp_sum',
                    found_columns['rotational_speed']: 'rotational_speed_sum'
                })
                
                stats['process_speed_by_product_type'] = process_speed_by_product_type.to_dict(orient='records')
            except Exception as e:
                print(f"Error creating process_speed_by_product_type: {str(e)}")
                pass

        # Speed and torque by product ID and type
        if all(key in found_columns for key in ['rotational_speed', 'torque', 'product_id', 'type']):
            try:
                speed_torque_by_product_type = df.groupby([found_columns['product_id'], found_columns['type']]).agg({
                    found_columns['rotational_speed']: 'sum',
                    found_columns['torque']: 'sum'
                }).reset_index()
                
                # Rename columns for clarity in the frontend
                speed_torque_by_product_type = speed_torque_by_product_type.rename(columns={
                    found_columns['product_id']: 'product_id',
                    found_columns['type']: 'type',
                    found_columns['rotational_speed']: 'rotational_speed_sum',
                    found_columns['torque']: 'torque_sum'
                })
                
                stats['speed_torque_by_product_type'] = speed_torque_by_product_type.to_dict(orient='records')
            except Exception as e:
                print(f"Error creating speed_torque_by_product_type: {str(e)}")
                pass
                
        # Combine all statistics
        result = {
            **basic_stats,
            **stats
        }
        
        return Response(result)
        
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)