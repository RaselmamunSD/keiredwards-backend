from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        import traceback
        tb = traceback.format_exc()
        return Response(
            {
                "success": False,
                "message": "An unexpected error occurred.",
                "errors": {"detail": [tb]},
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(response.data, dict):
        message = response.data.get("detail", "Request failed.")
        errors = response.data
    else:
        message = "Request failed."
        errors = {"detail": response.data}

    response.data = {
        "success": False,
        "message": str(message),
        "errors": errors,
        "status_code": response.status_code,
    }
    return response
