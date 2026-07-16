from rest_framework.response import Response


def success_response(message, data=None, status_code=200):
    return Response(
        {
            "success": True,
            "message": message,
            "data": data if data is not None else {},
            "status_code": status_code,
        },
        status=status_code,
    )

def error_response(message, status_code=400):
    return Response(
        {
            "success": False,
            "message": message,
            "status_code": status_code,
        },
        status=status_code,
    )
