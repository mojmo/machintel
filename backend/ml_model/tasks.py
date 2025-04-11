# ml_model/tasks.py
from celery import shared_task
from .predictors.predictor import PredictiveMaintenancePredictor
from datasets.models import Dataset
from predictions.models import Prediction
import os
from config.celery import app

@shared_task
def process_dataset(dataset_id):
    try:
        dataset = Dataset.objects.get(id=dataset_id)
        file_path = dataset.file.path

        predictor = PredictiveMaintenancePredictor()
        results = predictor.predict(file_path)

        # print("results:", results) # TODO: Remove

        # Save predictions to the database
        for result in results:

            product_id = result.get('product_id')

            if not product_id:
                print("Skipping row with missing product_id:", result)
                continue  # skip invalid row

            Prediction.objects.create(
                dataset=dataset,
                product_id=product_id,
                prediction=result.get('prediction', 'error'),
                confidence=result.get('confidence', None),
                features=result.get('features', {}),
            )

        print("Dataset processed successfully.")

    except Dataset.DoesNotExist:
        print(f"Dataset with ID {dataset_id} does not exist.")
    except Exception as e:
        print(f"Error processing dataset {dataset_id}: {str(e)}")