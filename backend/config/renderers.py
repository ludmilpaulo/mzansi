from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response


class ApiRenderer(JSONRenderer):
    """Wrap successful payloads in a consistent envelope without double-wrapping."""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        renderer_context = renderer_context or {}
        response: Response | None = renderer_context.get("response")
        if isinstance(data, dict) and ("success" in data):
            return super().render(data, accepted_media_type, renderer_context)

        status_code = getattr(response, "status_code", 200)
        if status_code >= 400:
            payload = data
        else:
            payload = {"success": True, "data": data}
        return super().render(payload, accepted_media_type, renderer_context)
