from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("authentication", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="authauditlog",
            name="endpoint",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="authauditlog",
            name="method",
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name="authauditlog",
            name="was_successful",
            field=models.BooleanField(default=True),
        ),
    ]
