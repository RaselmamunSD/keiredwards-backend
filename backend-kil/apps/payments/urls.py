from django.urls import path

from .views import PaymentCreateView, PaymentListView, PaymentVerifyView

urlpatterns = [
    path("", PaymentListView.as_view(), name="payment-list"),
    path("create/", PaymentCreateView.as_view(), name="payment-create"),
    path("verify/", PaymentVerifyView.as_view(), name="payment-verify"),
]
