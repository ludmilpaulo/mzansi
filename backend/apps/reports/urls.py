from django.urls import re_path

from apps.reports.views import DashboardStatsView

urlpatterns = [
    re_path(r"^reports/dashboard/?$", DashboardStatsView.as_view(), name="reports-dashboard"),
]
