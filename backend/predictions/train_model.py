# Import required libraries
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report

# Define dataset path
DATASET_PATH = "C:/study/Graduations Project/ai4i2020.csv"

# Load dataset
df = pd.read_csv(DATASET_PATH)

# Display basic dataset info
print("Dataset Overview:")
print(df.head())
print(df.info())

# Drop unnecessary columns (UDI, Product ID)
df = df.drop(['UDI', 'Product ID'], axis=1, errors='ignore')

# Define expected feature columns for consistency
EXPECTED_COLUMNS = ['Type', 'Air temperature [K]', 'Process temperature [K]', 
                    'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]']

# Define a preprocessing function to handle missing/extra columns
def preprocess_input_data(df):
    """
    Cleans and prepares any incoming dataset to match the expected format.
    - Removes extra columns
    - Adds missing expected columns with default values
    - Encodes categorical columns
    - Fills missing values with column mean
    """
    # Drop unnecessary columns if they exist
    df = df.drop(columns=[col for col in df.columns if col not in EXPECTED_COLUMNS], errors='ignore')

    # Add missing columns and set default values
    for col in EXPECTED_COLUMNS:
        if col not in df.columns:
            df[col] = np.nan  # Add missing columns with NaN

    # Encode categorical 'Type' column if it exists
    if 'Type' in df.columns:
        df['Type'] = df['Type'].astype('category').cat.codes

    # Fill missing values with column mean
    df.fillna(df.mean(), inplace=True)

    # Ensure final column order
    df = df[EXPECTED_COLUMNS]

    return df

# Apply preprocessing
df = preprocess_input_data(df)

# Define features (X) and target variable (y)
X = df
y = pd.read_csv(DATASET_PATH)['Machine failure']  # Extract target column separately

# Split data into training (80%) and testing (20%) sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a Decision Tree Classifier
model = DecisionTreeClassifier(random_state=42)
model.fit(X_train, y_train)

# Evaluate model performance
y_pred = model.predict(X_test)
print("\n🔍 Model Performance:")
print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# Save trained model and expected columns for future use
joblib.dump(model, "C:/study/Graduations Project/model.pkl")
joblib.dump(EXPECTED_COLUMNS, "C:/study/Graduations Project/expected_columns.pkl")

print("\n✅ Model training complete. Saved as 'model.pkl'.")
