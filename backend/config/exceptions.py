from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    payload = response.data
    fields = None
    detail = "Request failed."
    raw_code = getattr(exc, "default_code", "error")
    code = raw_code if isinstance(raw_code, str) else "error"

    if isinstance(payload, dict):
        if "detail" in payload and len(payload) == 1:
            detail = str(payload["detail"])
        else:
            fields = {key: value for key, value in payload.items() if key != "detail"}
            detail = str(payload.get("detail", detail))
    elif isinstance(payload, list) and payload:
        detail = str(payload[0])

    response.data = {
        "success": False,
        "error": {
            "code": code,
            "detail": detail,
            "fields": fields,
        },
    }
    return response


class ServiceUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Service temporarily unavailable."
    default_code = "service_unavailable"


class TrackingRateLimited(APIException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "Your application was checked recently. Please try again later."
    default_code = "rate_limited"


class TrackingIntegrationUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Automatic tracking is temporarily unavailable."
    default_code = "integration_unavailable"


class TrackingInvalidReference(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "We could not find an application using the provided details. Please verify your information."
    default_code = "invalid_reference"
