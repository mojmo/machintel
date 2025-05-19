#!/usr/bin/env python
# filepath: /home/mojtaba/projects/graduation/machintel/backend/ml_model/test_predictor.py
"""
Test script for the improved predictive maintenance predictor.
This script tests the predictor with different test datasets.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from ml_model.predictors.predictor_improved import PredictiveMaintenancePredictor


def test_dataset(dataset_path, description):
    """Test a single dataset and print results"""
    print(f"\n{'=' * 80}")
    print(f"Testing: {description}")
    print(f"Dataset: {dataset_path}")
    print(f"{'-' * 80}")
    
    if not os.path.exists(dataset_path):
        print(f"File not found: {dataset_path}")
        return
    
    predictor = PredictiveMaintenancePredictor()
    results = predictor.predict(dataset_path)
    
    # Check if there was an error with the whole dataset
    if len(results) == 1 and 'error' in results[0]:
        print(f"❌ ERROR: {results[0].get('error')}")
        print(f"Details: {results[0].get('details', '')}")
        return
    
    # Print summary of results
    normal_count = sum(1 for r in results if 'prediction' in r and r['prediction'] == 'Normal')
    failure_count = sum(1 for r in results if 'prediction' in r and r['prediction'] == 'Failure')
    error_count = sum(1 for r in results if 'error' in r)
    
    print(f"Total predictions: {len(results)}")
    print(f"Normal: {normal_count}")
    print(f"Failure: {failure_count}")
    print(f"Errors: {error_count}")
    
    # Print first 3 predictions as examples
    print(f"\nSample predictions:")
    for i, pred in enumerate(results[:3]):
        if 'prediction' in pred:
            print(f"{i+1}. Product ID: {pred['product_id']}")
            print(f"   Prediction: {pred['prediction']}")
            print(f"   Confidence: {pred['confidence']:.2f}")
        elif 'error' in pred:
            print(f"{i+1}. Product ID: {pred.get('product_id', 'unknown')}")
            print(f"   Error: {pred['error']}")
    
    print(f"{'=' * 80}")


def main():
    """Test the predictor with different datasets"""
    data_dir = Path(__file__).parent.parent.parent / "data"
    
    datasets = [
        (data_dir / "ai4i2020.csv", "Standard dataset (original column names)"),
        (data_dir / "test_simple_names.csv", "Simple column names without units"),
        (data_dir / "test_different_names.csv", "Different column names (snake_case)"),
        (data_dir / "test_extra_features.csv", "Dataset with extra features"),
        (data_dir / "test_missing_features.csv", "Dataset missing some features"),
        (data_dir / "test_no_tool_wear.csv", "Dataset without tool wear feature"),
        (data_dir / "test_completely_wrong_format.csv", "Completely wrong dataset format")
    ]
    
    print(f"\n{'=' * 80}")
    print(f"TESTING IMPROVED PREDICTIVE MAINTENANCE MODEL")
    print(f"{'=' * 80}")
    
    for dataset_path, description in datasets:
        test_dataset(dataset_path, description)


if __name__ == "__main__":
    main()
