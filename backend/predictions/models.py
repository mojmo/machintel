from django.db import models

class PredictionResult(models.Model):
    input_data = models.JSONField()
    prediction = models.CharField(max_length=20)
    probability = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prediction {self.id}"