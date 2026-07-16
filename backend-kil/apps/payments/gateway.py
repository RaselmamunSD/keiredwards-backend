import uuid
import base64
import requests
import json
from django.conf import settings

class PayPalGatewayError(Exception):
    pass

class PayPalGatewayClient:
    def __init__(self):
        self.mode = getattr(settings, 'PAYPAL_MODE', 'sandbox')
        self.client_id = getattr(settings, 'PAYPAL_CLIENT_ID', '')
        self.secret = getattr(settings, 'PAYPAL_SECRET_KEY', '')
        
        if self.mode == 'live':
            self.base_url = "https://api-m.paypal.com"
        else:
            self.base_url = "https://api-m.sandbox.paypal.com"
            
        self.timeout = getattr(settings, 'PAPYL_TIMEOUT', 20)

    def _get_access_token(self):
        """Fetches an OAuth2 access token from PayPal."""
        if not self.client_id or not self.secret:
            return None
            
        auth_str = f"{self.client_id}:{self.secret}"
        b64_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
        
        headers = {
            "Accept": "application/json",
            "Accept-Language": "en_US",
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/v1/oauth2/token",
                data="grant_type=client_credentials",
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json().get('access_token')
        except requests.RequestException as exc:
            raise PayPalGatewayError(f"Failed to get PayPal access token: {exc}") from exc

    def create_payment(self, *, amount, currency, transaction_id, callback_url):
        """Creates a PayPal order and returns the checkout URL."""
        access_token = self._get_access_token()
        
        if not access_token:
            # Fallback mock mode if paypal is not configured properly
            reference = f"paypal_mock_{uuid.uuid4().hex[:16]}"
            return {
                "reference": reference,
                "checkout_url": f"{settings.FRONTEND_URL}/payment/success?reference={reference}",
                "status": "pending",
                "raw": {"mode": "mock"},
            }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
            "PayPal-Request-Id": transaction_id,
        }

        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": transaction_id,
                    "amount": {
                        "currency_code": currency,
                        "value": str(amount)
                    }
                }
            ],
            "application_context": {
                "return_url": callback_url,
                "cancel_url": f"{settings.FRONTEND_URL}/payment/cancel",
                "user_action": "PAY_NOW"
            }
        }

        try:
            response = requests.post(
                f"{self.base_url}/v2/checkout/orders",
                json=payload,
                headers=headers,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as exc:
            raise PayPalGatewayError(f"PayPal create order failed: {exc}\nResponse: {exc.response.text if exc.response else ''}") from exc

        # Find the approve link
        approve_link = next((link['href'] for link in data.get('links', []) if link['rel'] == 'approve'), "")

        return {
            "reference": data.get("id", ""), # PayPal Order ID
            "checkout_url": approve_link,
            "status": "pending",
            "raw": data,
        }

    def verify_payment(self, reference):
        """Captures the PayPal order using the order ID (reference)."""
        access_token = self._get_access_token()
        
        if not access_token:
            return {"status": "completed", "raw": {"mode": "mock", "reference": reference}}

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }

        try:
            # First, check the order status
            get_response = requests.get(
                f"{self.base_url}/v2/checkout/orders/{reference}",
                headers=headers,
                timeout=self.timeout,
            )
            get_response.raise_for_status()
            order_data = get_response.json()
            
            if order_data.get('status') == 'COMPLETED':
                return {"status": "completed", "raw": order_data}
                
            if order_data.get('status') == 'APPROVED':
                # Capture the payment
                capture_response = requests.post(
                    f"{self.base_url}/v2/checkout/orders/{reference}/capture",
                    headers=headers,
                    timeout=self.timeout,
                )
                capture_response.raise_for_status()
                capture_data = capture_response.json()
                
                if capture_data.get('status') == 'COMPLETED':
                    return {"status": "completed", "raw": capture_data}
                else:
                    return {"status": "failed", "raw": capture_data}
                    
            return {"status": "pending", "raw": order_data}

        except requests.RequestException as exc:
            raise PayPalGatewayError(f"PayPal verify/capture payment failed: {exc}\nResponse: {exc.response.text if exc.response else ''}") from exc
            
    def verify_webhook_signature(self, headers, body_json_str):
        """Verifies the webhook signature using PayPal API."""
        access_token = self._get_access_token()
        if not access_token:
            return False
            
        webhook_id = getattr(settings, 'PAYPAL_WEBHOOK_ID', '')
        
        verify_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        try:
            body = json.loads(body_json_str)
            payload = {
                "auth_algo": headers.get('PAYPAL-AUTH-ALGO', ''),
                "cert_url": headers.get('PAYPAL-CERT-URL', ''),
                "transmission_id": headers.get('PAYPAL-TRANSMISSION-ID', ''),
                "transmission_sig": headers.get('PAYPAL-TRANSMISSION-SIG', ''),
                "transmission_time": headers.get('PAYPAL-TRANSMISSION-TIME', ''),
                "webhook_id": webhook_id,
                "webhook_event": body
            }
            
            response = requests.post(
                f"{self.base_url}/v1/notifications/verify-webhook-signature",
                json=payload,
                headers=verify_headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            return data.get("verification_status") == "SUCCESS"
        except Exception:
            return False
