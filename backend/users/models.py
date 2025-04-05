import uuid
from django.db import models
from django.utils import timezone
# from django.db.models.signals import pre_delete
# from django.dispatch import receiver
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True, blank=False, null=False)
    username = models.CharField(max_length=30, unique=True)
    first_name = models.CharField(max_length=30, blank=False)
    last_name = models.CharField(max_length=30, blank=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']


class GuestSession(models.Model):
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    # data = models.JSONField(default=dict)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(hours=24)
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        return timezone.now() < self.expires_at

# Signal to clean up related data
# @receiver(pre_delete, sender=GuestSession)
# def delete_session_relations(sender, instance, **kwargs):
#     from datasets.models import Dataset
#     from predictions.models import Prediction
    
#     # Delete all related data
#     Dataset.objects.filter(session_id=instance.session_id).delete()
#     Prediction.objects.filter(session_id=instance.session_id).delete()
