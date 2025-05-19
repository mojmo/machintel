from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0003_remove_dataset_session_key_dataset_session'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataset',
            name='error_message',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dataset',
            name='status',
            field=models.CharField(choices=[('uploading', 'Uploading'), ('uploaded', 'Uploaded'), ('processing', 'Processing'), ('processed', 'Processed'), ('error', 'Error')], default='uploaded', max_length=20),
        ),
    ]
