# ml_model/predictors/predictor.py
import pandas as pd
import numpy as np
import joblib
from pathlib import Path

class PredictiveMaintenancePredictor:
    def __init__(self):
        self.model = None
        self.features = None
        self.model_dir = Path(__file__).parent
        self.type_map = {'L': 0, 'M': 1, 'H': 2}
        self.load_latest_model()

    def load_latest_model(self) -> bool:
        """Load the most recent model with its feature list"""
        try:
            model_files = sorted(self.model_dir.glob("model_*.joblib"))
            if not model_files:
                raise FileNotFoundError("No model files found")

            latest_model = model_files[-1]

            print("[INFO] Loading model:", latest_model)

            self.model = joblib.load(latest_model)

            # Load corresponding features
            features_file = latest_model.name.replace("model_", "features_")
            features_data = joblib.load(self.model_dir / features_file)
            self.features = features_data['features']

            return True
        except Exception as e:
            print(f"[ERROR] Model loading failed: {str(e)}")
            return False

    def predict(self, file_path: str):
        print("file path: ", file_path)
        import os
        if not os.path.exists(file_path):
            print("File does not exist:", file_path)
            return []

        try:
            df = pd.read_csv(file_path)
            # print("File contents:", df.head()) # TODO: Remove
            
            results = []
            print("first 5 rows in dataset", df.head(5)) # TODO: Remove
            
            # This is important: Let the preprocessor handle the type conversion
            # Don't convert 'Type' to numeric here - let the OneHotEncoder do it
            
            for _, row in df.iterrows():
                if 'Product ID' not in row or pd.isna(row['Product ID']):
                    print("Row missing Product ID:", row)
                    continue

                try:
                    # Create a DataFrame with just one row for this prediction
                    # IMPORTANT: Leave Type as string for the OneHotEncoder
                    single_row_df = pd.DataFrame({
                        'Product ID': [str(row['Product ID'])],
                        'Type': [str(row['Type'])],  # Keep as string
                        'Air temperature [K]': [float(row['Air temperature [K]'])],
                        'Process temperature [K]': [float(row['Process temperature [K]'])],
                        'Rotational speed [rpm]': [float(row['Rotational speed [rpm]'])],
                        'Torque [Nm]': [float(row['Torque [Nm]'])],
                        'Tool wear [min]': [float(row['Tool wear [min]'])]
                    })
                    
                    # Select only the features used in training
                    X = single_row_df[self.features]
                    
                    # Debug - print types
                    # print(f"Row {row['Product ID']} types before preprocessing:", X.dtypes) # TODO: Remove
                    
                    # Apply preprocessing - this should handle categorical feature encoding
                    X_preprocessed = self.model['preprocessor'].transform(X)
                    
                    # Debug - print shape of preprocessed data
                    # print(f"Preprocessed shape: {X_preprocessed.shape}") # TODO: Remove
                    
                    # Make prediction
                    proba = self.model['classifier'].predict_proba(X_preprocessed)[0][1]
                    
                    results.append({
                        'product_id': row['Product ID'],
                        'prediction': 'Failure' if proba >= 0.5 else 'Normal',
                        'confidence': float(proba),
                        'features': {
                            'Product ID': str(row['Product ID']),
                            'Type': str(row['Type']),  # keep original string
                            'Air temperature [K]': float(row['Air temperature [K]']),
                            'Process temperature [K]': float(row['Process temperature [K]']),
                            'Rotational speed [rpm]': float(row['Rotational speed [rpm]']),
                            'Torque [Nm]': float(row['Torque [Nm]']),
                            'Tool wear [min]': float(row['Tool wear [min]'])
                        }
                    })

                except Exception as e:
                    error_message = f"Error processing row: {str(e)}"
                    print(error_message)
                    results.append({
                        'product_id': row.get('Product ID', 'unknown'),
                        'error': error_message
                    })

            # print("results from predictor: ", results) # TODO: Remove
            return results

        except Exception as e:
            print(f"Exception in predict method: {str(e)}")
            return [{"error": str(e)}]