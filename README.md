# MachIntel

## Project Overview
MachIntel is a machine learning-based predictive maintenance system for CNC machines.

## Machine Learning Model

MachIntel uses a decision tree classifier with SMOTE (Synthetic Minority Over-sampling Technique) for handling class imbalance in CNC machine failure prediction. The model processes several key features:

- Machine Type (High/Medium/Low)
- Air temperature (K)
- Process temperature (K)
- Rotational speed (rpm)
- Torque (Nm)
- Tool wear (min)

### Flexible Feature Handling

The improved model can handle different feature names and formats:

- Automatically detects feature names with different formatting (camelCase, snake_case, with/without units)
- Handles additional features in the dataset by focusing on the required ones
- Provides graceful degradation when features are missing by using default values
- Displays meaningful error messages when datasets cannot be processed

### Test Datasets

The `data/` directory includes several test datasets to demonstrate the model's flexibility:

- `test_simple_names.csv`: Simple column names without units
- `test_different_names.csv`: Different column names in snake_case format
- `test_extra_features.csv`: Dataset with additional columns
- `test_missing_features.csv`: Dataset missing some required features
- `test_no_tool_wear.csv`: Dataset without tool wear information
- `test_completely_wrong_format.csv`: Incompatible dataset format

### Testing the Model

You can test the model's flexibility with:

```bash
cd backend
python ml_model/test_predictor.py
```

To train the model with different test datasets:

```bash
cd backend
python ml_model/train_test_datasets.py
```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/mojmo/machintel.git