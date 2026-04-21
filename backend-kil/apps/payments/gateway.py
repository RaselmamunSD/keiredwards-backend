import uuid

import requests
from django.conf import settings


class PapylGatewayError(Exception):
    pass


class PapylGatewayClient:
    def __init__(self):
        self.base_url = settings.PAPYL_BASE_URL.rstrip("/")
        self.api_key = settings.PAPYL_API_KEY
        self.timeout = settings.PAPYL_TIMEOUT

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def create_payment(self, *, amount, currency, transaction_id, callback_url):
        # Fallback mock mode when papyl credentials are not configured.
        if not self.api_key:
            reference = f"papyl_mock_{uuid.uuid4().hex[:16]}"
            return {
                "reference": reference,
                "checkout_url": f"{settings.FRONTEND_URL}/payment/success?reference={reference}",
                "status": "pending",
                "raw": {"mode": "mock"},
            }

        payload = {
            "amount": str(amount),
            "currency": currency,
            "transaction_id": transaction_id,
            "callback_url": callback_url,
        }

        try:
            response = requests.post(
                f"{self.base_url}/payments",
                json=payload,
                headers=self._headers(),
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as exc:
            raise PapylGatewayError(f"Papyl create payment failed: {exc}") from exc

        return {
            "reference": data.get("reference", ""),
            "checkout_url": data.get("checkout_url", ""),
            "status": data.get("status", "pending"),
            "raw": data,
        }

    def verify_payment(self, reference):
        if not self.api_key:
            return {"status": "completed", "raw": {"mode": "mock", "reference": reference}}

        try:
            response = requests.get(
                f"{self.base_url}/payments/{reference}",
                headers=self._headers(),
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as exc:
            raise PapylGatewayError(f"Papyl verify payment failed: {exc}") from exc

        return {"status": data.get("status", "pending"), "raw": data}
