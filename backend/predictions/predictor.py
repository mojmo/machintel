import pandas as pd
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Union
import joblib

class PredictiveMaintenancePredictor:
    def __init__(self):
        self.model = None
        self.features = None
        self.model_dir = Path(__file__).parent
        self.load_latest_model()

    def load_latest_model(self) -> bool:
        """Load the most recent model with error handling"""
        try:
            model_files = sorted(self.model_dir.glob("model_*.joblib"))
            if not model_files:
                raise FileNotFoundError("No model files found")
            
            latest_model = model_files[-1]
            self.model = joblib.load(latest_model)
            
            # Load corresponding features
            features_file = latest_model.name.replace("model_", "features_")
            features_data = joblib.load(self.model_dir / features_file)
            self.features = features_data['features']
            
            return True
        except Exception as e:
            print(f"Model loading error: {str(e)}")
            return False

    def predict(self, input_data: Union[Dict, List[Dict]]) -> Dict:
        try:
            # Handle single or batch predictions
            if isinstance(input_data, dict):
                input_data = [input_data]
                
            df = pd.DataFrame(input_data)
            
            # Validate features
            missing = [f for f in self.features if f not in df.columns]
            if missing:
                return {
                    "success": False,
                    "error": f"Missing features: {missing}"
                }
            
            # Make predictions
            results = []
            for _, row in df.iterrows():
                proba = self.model.predict_proba([row[self.features]])[0][1]
                results.append({
                    "machine_id": row.get('Machine_ID', 'unknown'),
                    "prediction": "Failure" if proba >= 0.5 else "Normal",
                    "probability": float(proba),
                    "timestamp": datetime.now().isoformat()
                })
            
            return {
                "predictions": results,
                "model_version": self.model_dir.name,
                "success": True
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }