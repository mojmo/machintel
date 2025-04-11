import pandas as pd
import numpy as np
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
        self.model_dir = Path(__file__).parent  # Save models in predictions/
        
    def train_model(self, data_path="../../data/ai4i2020.csv"):
        """Train model with manual preprocessing and SMOTE handling"""
        try:
            # Load data using relative path
            data_path = Path(__file__).parent.parent.parent / "data" / "ai4i2020.csv"
            print(f"⏳ Loading dataset from {data_path}...")
            df = pd.read_csv(data_path)
            
            # Auto-detect features/target
            self.features = self._detect_features(df)
            self.target = 'Machine failure' if 'Machine failure' in df.columns else df.columns[-1]
            
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
            joblib.dump({
                'features': self.features,
                'target': self.target,
                'feature_types': {
                    col: 'numeric' if df[col].dtype in ['int64', 'float64'] else 'categorical' 
                    for col in self.features
                },
                'training_stats': df[self.features].describe().to_dict()
            }, features_path)
            
            print(f"\n💾 Model saved to:\n{model_path}")
            print(f"💾 Feature metadata saved to:\n{features_path}")
            
            return True
            
        except Exception as e:
            print(f"❌ Training failed: {str(e)}")
            return False

    
    def _evaluate(self, X_test, y_test):
        """Generate evaluation metrics"""
        y_pred = self.model.predict(X_test)
        print("\n📊 Classification Report:")
        print(classification_report(y_test, y_pred))
        print("\n🧮 Confusion Matrix:")
        print(confusion_matrix(y_test, y_pred))
    
    def _detect_features(self, df):
        """Auto-detect relevant features"""
        exclude = ['UDI', 'Product ID', 'Machine failure', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF']
        return [col for col in df.columns if col not in exclude and df[col].nunique() > 1]

# Example Usage
if __name__ == "__main__":
    pm_model = PredictiveMaintenanceModel()
    pm_model.train_model()