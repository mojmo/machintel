from django.db import models
from datasets.models import Dataset


class Insight(models.Model):
    insight_id = models.BigAutoField(primary_key=True)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name='insights')
    recommendation = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Insight for Dataset {self.dataset.id} - {self.created_at}"
