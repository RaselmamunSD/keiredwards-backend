from django.http import JsonResponse

class PaymentRequiredMiddleware:
    """
    Middleware to require a successful payment before allowing access to the API.
    Exempts authentication endpoints, payment endpoints, and webhooks.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path_info

        # Allow unauthenticated paths or specific paths
        exempt_paths = [
            "/api/v1/accounts/register/",
            "/api/v1/accounts/login/",
            "/api/v1/accounts/password-reset/",
            "/api/v1/accounts/password-reset/confirm/",
            "/api/v1/payments/",
            "/api/v1/payments/create/",
            "/api/v1/payments/verify/",
            "/api/v1/payments/webhook/",
            "/api/v1/payments/pricing/",
            "/admin/",
            "/media/",
        ]
        
        is_exempt = False
        for ep in exempt_paths:
            if path.startswith(ep):
                is_exempt = True
                break

        if not is_exempt and request.user.is_authenticated:
            # Check if user has a completed payment
            has_paid = request.user.payments.filter(status="completed").exists()
            if not has_paid:
                return JsonResponse(
                    {
                        "success": False,
                        "message": "Payment is required before accessing the account.",
                        "status_code": 403,
                        "code": "payment_required"
                    },
                    status=403
                )

        response = self.get_response(request)
        return response
