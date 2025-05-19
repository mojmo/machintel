import pandas as pd
import numpy as np
import re
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from imblearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import classification_report, confusion_matrix
import joblib
from datetime import datetime

class PredictiveMaintenanceModel:
    def __init__(self):
        self.model = None
        self.features = None
        self.target = None
        self.preprocessor = None
        self.model_dir = Path(__file__).parent / "predictors"  # Save models in predictors/
        # Ensure model directory exists
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        # Define standard feature patterns to detect
        self.feature_patterns = {
            'Type': [r'type', r'machine.?type'],
            'Air temperature [K]': [r'air.*temp', r'air.*k'],
            'Process temperature [K]': [r'process.*temp', r'process.*k'],
            'Rotational speed [rpm]': [r'rotation', r'speed', r'rpm'],
            'Torque [Nm]': [r'torque', r'nm'],
            'Tool wear [min]': [r'tool.*wear', r'wear']
        }
        
        # Define target patterns
        self.target_patterns = [r'machine.*fail', r'failure']
        
    def _normalize_column_name(self, column):
        """Normalize column name by converting to lowercase and removing special characters"""
        return re.sub(r'[^a-z0-9]', '', column.lower())
    
    def _map_columns(self, df):
        """Map columns in the dataset to standard feature names"""
        column_mapping = {}
        normalized_cols = {self._normalize_column_name(col): col for col in df.columns}
        
        # Map standard features
        for standard_name, patterns in self.feature_patterns.items():
            found = False
            for pattern in patterns:
                for norm_col, orig_col in normalized_cols.items():
                    if re.search(pattern, norm_col):
                        column_mapping[orig_col] = standard_name
                        found = True
                        break
                if found:
                    break
        
        # Find target column
        target_col = None
        for pattern in self.target_patterns:
            for norm_col, orig_col in normalized_cols.items():
                if re.search(pattern, norm_col):
                    target_col = orig_col
                    break
            if target_col:
                break
                
        # If no target column found, look for 'Machine failure' or last column
        if not target_col:
            if 'Machine failure' in df.columns:
                target_col = 'Machine failure'
            else:
                # Use last column as target as a last resort
                target_col = df.columns[-1]
        
        return column_mapping, target_col
        
    def train_model(self, data_path="../../data/ai4i2020.csv"):
        """Train model with manual preprocessing and SMOTE handling"""
        try:
            # Load data using relative path
            data_path = Path(data_path)
            if not data_path.is_absolute():
                data_path = Path(__file__).parent.parent.parent / "data" / data_path.name
                
            print(f"⏳ Loading dataset from {data_path}...")
            df = pd.read_csv(data_path)
            
            # Map columns to standard names
            column_mapping, target_col = self._map_columns(df)
            
            # If mapping exists, rename columns
            if column_mapping:
                df = df.rename(columns=column_mapping)
                
            print(f"🔍 Detected columns: {', '.join(df.columns)}")
            print(f"🎯 Target column: {target_col}")
            
            # Auto-detect features
            self.features = self._detect_features(df, target_col)
            self.target = target_col
            
            print(f"📊 Using features: {', '.join(self.features)}")
            
            # Train-test split
            X_train, X_test, y_train, y_test = train_test_split(
                df[self.features], 
                df[self.target], 
                test_size=0.2, 
                random_state=42
            )
            
            # Preprocessing setup
            numeric_features = [f for f in self.features if df[f].dtype in ['int64', 'float64']]
            categorical_features = [f for f in self.features if df[f].dtype == 'object']
            
            print(f"🔢 Numeric features: {', '.join(numeric_features)}")
            print(f"🔠 Categorical features: {', '.join(categorical_features)}")
            
            self.preprocessor = ColumnTransformer([
                ('num', 'passthrough', numeric_features),
                ('cat', OneHotEncoder(handle_unknown='ignore', sparse=False), categorical_features)
            ])
            
            # Transform data
            print("🔄 Preprocessing data...")
            X_train_transformed = self.preprocessor.fit_transform(X_train)
            X_test_transformed = self.preprocessor.transform(X_test)
            
            # Apply SMOTE
            print("🧪 Applying SMOTE for class balancing...")
            smote = SMOTE(random_state=42)
            X_resampled, y_resampled = smote.fit_resample(X_train_transformed, y_train)
            
            # Train classifier
            print("🚀 Training classifier...")
            classifier = DecisionTreeClassifier(random_state=42, max_depth=5)
            classifier.fit(X_resampled, y_resampled)
            
            # Save model (preprocessor + classifier)
            self.model = {
                'preprocessor': self.preprocessor,
                'classifier': classifier
            }
            
            # Evaluate model
            y_pred = classifier.predict(X_test_transformed)
            print("\n📊 Classification Report:")
            print(classification_report(y_test, y_pred))
            print("\n🧮 Confusion Matrix:")
            print(confusion_matrix(y_test, y_pred))
            
            # Save artifacts
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            model_path = self.model_dir / f"model_{timestamp}.joblib"
            joblib.dump(self.model, model_path)
            
            features_path = self.model_dir / f"features_{timestamp}.joblib"
            
            # Save feature mappings for predictor
            feature_mappings = {}
            for standard_name, patterns in self.feature_patterns.items():
                variations = [standard_name]  # Start with the standard name
                # Add variations without units
                base_name = standard_name.split('[')[0].strip()
                variations.append(base_name)
                # Add snake_case and lower variants
                variations.append(base_name.lower().replace(' ', '_'))
                variations.append(base_name.lower())
                # Add patterns
                feature_mappings[standard_name] = variations
            
            joblib.dump({
                'features': self.features,
                'target': self.target,
                'feature_mappings': feature_mappings,
                'feature_types': {
                    col: 'numeric' if df[col].dtype in ['int64', 'float64'] else 'categorical' 
                    for col in self.features
                },
                'training_stats': df[self.features].describe().to_dict(),
                'column_mapping': column_mapping
            }, features_path)
            
            print(f"\n💾 Model saved to:\n{model_path}")
            print(f"💾 Feature metadata saved to:\n{features_path}")
            
            return True
            
        except Exception as e:
            print(f"❌ Training failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    
    def _evaluate(self, X_test, y_test):
        """Generate evaluation metrics"""
        y_pred = self.model['classifier'].predict(X_test)
        print("\n📊 Classification Report:")
        print(classification_report(y_test, y_pred))
        print("\n🧮 Confusion Matrix:")
        print(confusion_matrix(y_test, y_pred))
    
    def _detect_features(self, df, target_col):
        """Auto-detect relevant features"""
        # Common columns to exclude
        exclude = ['UDI', 'Product ID', 'ProductID', 'ID', target_col, 'TWF', 'HDF', 'PWF', 'OSF', 'RNF']
        
        # Check for each column if it should be included
        features = []
        for col in df.columns:
            # Skip if column is in exclude list or matches a pattern like "product.*id"
            if col in exclude or any(re.search(pattern, col.lower()) for pattern in [r'product.*id', r'udi']):
                continue
            
            # Include if column has more than 1 unique value
            if df[col].nunique() > 1:
                features.append(col)
                
        return features

# Example Usage
if __name__ == "__main__":
    pm_model = PredictiveMaintenanceModel()
    # Train on standard dataset
    pm_model.train_model()
    
    # Train on test datasets
    print("\n\n📌 Training on alternative datasets for testing:")
    test_files = [
        "test_simple_names.csv",
        "test_different_names.csv",
        "test_extra_features.csv"
    ]
    
    for test_file in test_files:
        print(f"\n\n🧪 Testing with {test_file}")
        pm_model.train_model(f"../../data/{test_file}")
