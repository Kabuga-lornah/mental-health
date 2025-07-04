# Generated by Django 5.2.3 on 2025-06-20 08:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mental_health_app', '0012_therapistapplication_hourly_rate'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='checkout_request_id',
            field=models.CharField(blank=True, help_text="Safaricom's CheckoutRequestID for STK Push", max_length=100, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='mpesa_receipt_number',
            field=models.CharField(blank=True, help_text='Mpesa Receipt Number after successful transaction', max_length=50, null=True, unique=True),
        ),
    ]
