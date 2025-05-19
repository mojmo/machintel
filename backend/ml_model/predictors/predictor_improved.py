# ml_model/predictors/predictor_improved.py
import pandas as pd
import numpy as np
import joblib
import re
from pathlib import Path

class PredictiveMaintenancePredictor:
    def __init__(self):
        self.model = None
        self.features = None
        self.feature_mappings = None
        self.model_dir = Path(__file__).parent
        self.required_features = [
            "Type",
            "Air temperature",
            "Process temperature",
            "Rotational speed",
            "Torque",
            "Tool wear",
        ]
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
            
            # Create a feature mapping dictionary to handle different column names
            self.feature_mappings = {
                # Standard column name variations
                'Type': ['Type', 'type', 'machine_type', 'machine type', 'machine-type', 'machine', 'Type_', 'machinetype'],
                'Air temperature [K]': ['Air temperature [K]', 'Air temperature', 'air_temperature', 'air temperature', 'air-temperature', 'air_temp', 'air temp', 'Temperature_Air', 'air', 'temp', 'temperature', 'airtemp'],
                'Process temperature [K]': ['Process temperature [K]', 'Process temperature', 'process_temperature', 'process temperature', 'process-temperature', 'process_temp', 'process temp', 'Temperature_Process', 'process', 'processtemp'],
                'Rotational speed [rpm]': ['Rotational speed [rpm]', 'Rotational speed', 'rotational_speed', 'rotational speed', 'rotation speed', 'rpm', 'speed', 'Speed', 'rotation'],
                'Torque [Nm]': ['Torque [Nm]', 'Torque', 'torque', 'torque_nm', 'nm', 'Torque_Value', 'Nm'],
                'Tool wear [min]': ['Tool wear [min]', 'Tool wear', 'tool_wear', 'tool wear', 'wear', 'Wear_Tool', 'tool', 'min']
            }
            
            # Map for target/failure column
            self.target_mappings = [
                'Machine failure', 'Machine_failure', 'Failure', 'failure', 
                'machine failure', 'machine_failure', 'fail', 'Fail'
            ]

            return True
        except Exception as e:
            print(f"[ERROR] Model loading failed: {str(e)}")
            return False
    
    def _map_column_names(self, df):
        """Map column names in the dataset to the expected feature names"""
        column_mapping = {}
        
        # Create a dictionary of {input_column_name: standard_column_name}
        for standard_name, variations in self.feature_mappings.items():
            found = False
            for variation in variations:
                for col in df.columns:
                    # Check if the column matches a variation (case insensitive)
                    variation_lower = variation.lower()
                    col_lower = col.lower()
                    if variation_lower == col_lower or \
                       re.search(rf"{variation_lower}", col_lower) or \
                       variation_lower in col_lower or \
                       col_lower in variation_lower:
                        column_mapping[col] = standard_name
                        found = True
                        break
                if found:
                    break
        
        # Try to find and map the failure/target column if present
        self.target_column = None
        for col in df.columns:
            col_lower = col.lower()
            if any(target.lower() in col_lower or col_lower in target.lower() for target in self.target_mappings):
                self.target_column = col
                break
                    
        # If any required feature is missing, log it
        missing_features = []
        for standard_name in self.feature_mappings.keys():
            if standard_name not in column_mapping.values():
                base_name = standard_name.split('[')[0].strip()
                missing_features.append(base_name)
                
        # Return both the mapping and any missing features
        return column_mapping, missing_features
    
    def predict(self, file_path: str):
        print("file path: ", file_path)
        import os
        if not os.path.exists(file_path):
            print("File does not exist:", file_path)
            return [{"error": "File not found", "details": f"The file {file_path} does not exist."}]

        try:
            df = pd.read_csv(file_path)
            
            # Map column names to expected feature names
            column_mapping, missing_features = self._map_column_names(df)
            
            # If there are missing required features, return an error
            if missing_features:
                error_msg = f"Missing required features: {', '.join(missing_features)}"
                print(f"[ERROR] {error_msg}")
                return [{"error": "Missing required features", "details": error_msg}]
                
            # Rename columns according to mapping
            df_renamed = df.rename(columns=column_mapping)
            
            # If 'Product ID' column doesn't exist, look for similar names
            product_id_variations = ['Product ID', 'product_id', 'product id', 'id', 'ID', 'product-id']
            product_id_col = None
            for var in product_id_variations:
                if var in df.columns:
                    product_id_col = var
                    break
            
            # If no Product ID column is found, create one with row indices
            if not product_id_col:
                print("[WARNING] No Product ID column found, using row indices")
                df_renamed['Product ID'] = [f"ROW_{i+1}" for i in range(len(df))]
                product_id_col = 'Product ID'
            
            results = []
            
            for _, row in df.iterrows():
                try:
                    # Create a DataFrame with just one row for prediction                
                    single_row = pd.DataFrame({
                        'Type': [str(row.get(column_mapping.get('Type', 'Type'), 'M'))],  # Default to 'M' if missing
                        'Air temperature [K]': [float(row.get(column_mapping.get('Air temperature [K]', 'Air temperature [K]'), 298.0))],
                        'Process temperature [K]': [float(row.get(column_mapping.get('Process temperature [K]', 'Process temperature [K]'), 308.0))],
                        'Rotational speed [rpm]': [float(row.get(column_mapping.get('Rotational speed [rpm]', 'Rotational speed [rpm]'), 1500.0))],
                        'Torque [Nm]': [float(row.get(column_mapping.get('Torque [Nm]', 'Torque [Nm]'), 40.0))],
                        'Tool wear [min]': [float(row.get(column_mapping.get('Tool wear [min]', 'Tool wear [min]'), 0.0))]
                    })
                    
                    # Select only the features used in training
                    X = single_row[self.features]
                    
                    # Apply preprocessing
                    X_preprocessed = self.model['preprocessor'].transform(X)
                    
                    # Make prediction
                    proba = self.model['classifier'].predict_proba(X_preprocessed)[0][1]
                    
                    # Get product ID from original row
                    product_id = str(row.get(product_id_col, f"ROW_{_+1}"))
                    
                    results.append({
                        'product_id': product_id,
                        'prediction': 'Failure' if proba >= 0.5 else 'Normal',
                        'confidence': float(proba),
                        'features': {
                            'Product ID': product_id,
                            'Type': str(row.get(column_mapping.get('Type', 'Type'), 'M')),
                            'Air temperature [K]': float(row.get(column_mapping.get('Air temperature [K]', 'Air temperature [K]'), 298.0)),
                            'Process temperature [K]': float(row.get(column_mapping.get('Process temperature [K]', 'Process temperature [K]'), 308.0)),
                            'Rotational speed [rpm]': float(row.get(column_mapping.get('Rotational speed [rpm]', 'Rotational speed [rpm]'), 1500.0)),
                            'Torque [Nm]': float(row.get(column_mapping.get('Torque [Nm]', 'Torque [Nm]'), 40.0)),
                            'Tool wear [min]': float(row.get(column_mapping.get('Tool wear [min]', 'Tool wear [min]'), 0.0))
                        }
                    })

                except Exception as e:
                    error_message = f"Error processing row: {str(e)}"
                    print(error_message)
                    results.append({
                        'product_id': row.get(product_id_col, f"ROW_{_+1}"),
                        'error': error_message
                    })

            return results

        except Exception as e:
            error_message = f"Failed to process dataset: {str(e)}"
            print(f"[ERROR] {error_message}")
            return [{"error": error_message}]
