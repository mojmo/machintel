# ml_model/tasks.py
from celery import shared_task
from .predictors.predictor_improved import PredictiveMaintenancePredictor
from datasets.models import Dataset
from predictions.models import Prediction
import os
from django.db import transaction
from config.celery import app

@shared_task
def process_dataset(dataset_id):
    try:
        dataset = Dataset.objects.get(id=dataset_id)
        file_path = dataset.file.path

        predictor = PredictiveMaintenancePredictor()
        results = predictor.predict(file_path)
        
        # Check if there was an error with the entire dataset
        if len(results) == 1 and 'error' in results[0]:
            error = results[0]
            # Update dataset with error state
            dataset.status = 'error'
            dataset.error_message = f"{error.get('error')}: {error.get('details', '')}"
            dataset.save()
            print(f"Dataset {dataset_id} processing failed: {dataset.error_message}")
            return

        with transaction.atomic():
            # First delete any existing predictions for this dataset
            Prediction.objects.filter(dataset_id=dataset_id).delete()
            
            # Then save new predictions
            for result in results:
                # Check if this result has an error
                if 'error' in result:
                    print(f"Error in row: {result}")
                    # Create an error prediction record
                    Prediction.objects.create(
                        dataset=dataset,
                        product_id=str(result.get('product_id', 'unknown')),
                        prediction='error',
                        confidence=0.0,
                        features={
                            'error': result['error']
                        },
                    )
                    continue

                product_id = result.get('product_id')
                if not product_id:
                    print("Skipping row with missing product_id:", result)
                    continue  # skip invalid row

                Prediction.objects.create(
                    dataset=dataset,
                    product_id=product_id,
                    prediction=result.get('prediction', 'error'),
                    confidence=result.get('confidence', 0.0),
                    features=result.get('features', {}),
                )
            
            # Update dataset status
            dataset.status = 'processed'
            dataset.error_message = None
            dataset.save()

        print("Dataset processed successfully.")

    except Dataset.DoesNotExist:
        print(f"Dataset with ID {dataset_id} does not exist.")
        raise Exception(f"Dataset with ID {dataset_id} does not exist.")
    except Exception as e:
        error_message = f"Error processing dataset {dataset_id}: {str(e)}"
        print(error_message)
        
        # Update dataset with error state
        try:
            dataset = Dataset.objects.get(id=dataset_id)
            dataset.status = 'error'
            dataset.error_message = error_message
            dataset.save()
        except Exception as update_error:
            print(f"Failed to update dataset with error status: {str(update_error)}")
            
        raise Exception(error_message)