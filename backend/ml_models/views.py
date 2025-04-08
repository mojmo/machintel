from django.http import JsonResponse
from django.views import View
from pathlib import Path
import joblib
import json
from .predictor import PredictiveMaintenancePredictor

predictor = PredictiveMaintenancePredictor()

class PredictView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            result = predictor.predict(data)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({
                "success": False,
                "error": str(e)
            }, status=400)

class ModelInfoView(View):
    def get(self, request):
        try:
            model_dir = Path(__file__).parent
            model_files = sorted(model_dir.glob("model_*.joblib"))
            
            if not model_files:
                raise FileNotFoundError("No trained models found")
            
            latest_model = model_files[-1]
            features_file = latest_model.name.replace("model_", "features_")
            
            return JsonResponse({
                "model_version": latest_model.stem,
                "last_modified": latest_model.stat().st_mtime,
                "features": joblib.load(model_dir / features_file)['features'],
                "status": "operational"
            })
        except Exception as e:
            return JsonResponse({
                "error": str(e)
            }, status=500)