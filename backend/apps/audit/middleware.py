class RequestAuditMiddleware:
    """Lightweight request tagging. Sensitive mutations are logged explicitly in views."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)
