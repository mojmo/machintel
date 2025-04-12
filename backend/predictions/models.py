from django.db import models
from datasets.models import Dataset

class Prediction(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
    product_id = models.CharField(max_length=50)
    prediction = models.CharField(max_length=20)  # 'Normal'/'Failure'
    confidence = models.FloatField()
    features = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['dataset', 'product_id']),
        ]