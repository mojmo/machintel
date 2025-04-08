from pathlib import Path
import joblib
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .predictor import PredictiveMaintenancePredictor
from .serializers import PredictionInputSerializer, ModelInfoSerializer

predictor = PredictiveMaintenancePredictor()

class PredictView(APIView):
    """
    API endpoint for making predictions
    """
    def post(self, request):
        try:
            # Validate input data
            input_data = request.data
            result = predictor.predict(input_data)
            
            if not result['success']:
                return Response(
                    {'error': result['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ModelInfoView(APIView):
    """
    API endpoint for getting model information
    """
    def get(self, request):
        try:
            model_dir = Path(__file__).parent
            model_files = sorted(model_dir.glob("model_*.joblib"))
            
            if not model_files:
                return Response(
                    {'error': 'No trained models found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            latest_model = model_files[-1]
            features_file = latest_model.name.replace("model_", "features_")
            
            model_info = {
                "model_version": latest_model.stem,
                "last_modified": latest_model.stat().st_mtime,
                "features": joblib.load(model_dir / features_file)['features'],
                "status": "operational"
            }
            
            # Validate response data
            serializer = ModelInfoSerializer(data=model_info)
            if serializer.is_valid():
                return Response(serializer.data)
            
            return Response(
                serializer.errors,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )