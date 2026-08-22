from rest_framework.permissions import BasePermission, SAFE_METHODS

STAFF_ROLES = {
    "SUPER_ADMIN",
    "ADMIN",
    "CONSULTANT",
    "DOCUMENT_REVIEWER",
    "FINANCE",
    "SUPPORT",
}

ADMIN_ROLES = {"SUPER_ADMIN", "ADMIN"}
CONSULTANT_ROLES = {"SUPER_ADMIN", "ADMIN", "CONSULTANT"}
REVIEWER_ROLES = {"SUPER_ADMIN", "ADMIN", "DOCUMENT_REVIEWER"}
FINANCE_ROLES = {"SUPER_ADMIN", "ADMIN", "FINANCE"}
SUPPORT_ROLES = {"SUPER_ADMIN", "ADMIN", "SUPPORT", "CONSULTANT"}


def role_of(user) -> str:
    return getattr(user, "role", "") or ""


class IsAuthenticatedClient(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and role_of(request.user) == "CLIENT")


class IsStaffUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and role_of(request.user) in STAFF_ROLES)


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and role_of(request.user) in ADMIN_ROLES)


class IsConsultantRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and role_of(request.user) in CONSULTANT_ROLES)


class IsReviewerRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and role_of(request.user) in REVIEWER_ROLES)


class IsFinanceRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and role_of(request.user) in FINANCE_ROLES)


class IsSupportRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and role_of(request.user) in SUPPORT_ROLES)


class ReadOnlyOrStaff(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and role_of(request.user) in ADMIN_ROLES)
