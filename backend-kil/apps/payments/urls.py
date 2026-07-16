from django.urls import path

from .views import PaymentCreateView, PaymentListView, PaymentVerifyView, PricingConfigView, PayPalWebhookView

urlpatterns = [
    path("", PaymentListView.as_view(), name="payment-list"),
    path("create/", PaymentCreateView.as_view(), name="payment-create"),
    path("verify/", PaymentVerifyView.as_view(), name="payment-verify"),
    path("pricing/", PricingConfigView.as_view(), name="pricing-config"),
    path("webhook/", PayPalWebhookView.as_view(), name="payment-webhook"),
]
