from django.db import models
from users.models import User

class Dataset(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session = models.ForeignKey('users.GuestSession', on_delete=models.CASCADE, null=True, blank=True)
    file = models.FileField(upload_to='datasets/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dataset uploaded by {self.user or 'Guest'} on {self.uploaded_at}"
