from django.db import models
from users.models import User

class Dataset(models.Model):
    STATUS_CHOICES = (
        ('uploading', 'Uploading'),
        ('uploaded', 'Uploaded'),
        ('processing', 'Processing'),
        ('processed', 'Processed'),
        ('error', 'Error'),
    )
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session = models.ForeignKey('users.GuestSession', on_delete=models.CASCADE, null=True, blank=True)
    file = models.FileField(upload_to='datasets/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    error_message = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Dataset uploaded by {self.user or 'Guest'} on {self.uploaded_at}"
