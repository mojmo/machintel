# Run this command manually (or schedule it) :  python manage.py delete_expired_guest_datasets
# To automate it, use a scheduled job: Windows: Task Scheduler, Linux/macOS: cron job
from django.core.management.base import BaseCommand
from datasets.models import Dataset
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Deletes guest datasets older than 24 hours'

    def handle(self, *args, **kwargs):
        expiration_time = timezone.now() - timedelta(hours=24)
        expired_datasets = Dataset.objects.filter(user__isnull=True, uploaded_at__lt=expiration_time)

        count = expired_datasets.count()
        for dataset in expired_datasets:
            dataset.file.delete()  # delete the file from disk
            dataset.delete()       # delete record from database

        self.stdout.write(self.style.SUCCESS(f'Deleted {count} expired guest datasets'))
        print(f"Deleting file: {dataset.file.path}")
