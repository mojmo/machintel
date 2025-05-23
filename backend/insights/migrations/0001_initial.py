# Generated by Django 5.2 on 2025-04-12 09:58

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('datasets', '0003_remove_dataset_session_key_dataset_session'),
    ]

    operations = [
        migrations.CreateModel(
            name='Insight',
            fields=[
                ('insight_id', models.BigAutoField(primary_key=True, serialize=False)),
                ('recommendation', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('dataset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='insights', to='datasets.dataset')),
            ],
        ),
    ]
