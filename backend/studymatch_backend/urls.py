from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from administration.views import report_user, admin_get_reports, admin_update_report

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/",          include("authentication.urls")),
    path("api/profile/",       include("user_profile.urls")),
    path("api/discovery/",     include("discovery.urls")),
    path("api/connections/",   include("connection.urls")),
    path("api/guilds/",        include("guild.urls")),
    path("api/admin/",         include("administration.urls")),
    path("api/chat/",          include("chat.urls")),
    path("api/notifications/", include("notification.urls")), 
    path("api/connections/report/<uuid:user_id>/", report_user,         name="report_user"),
    path("api/admin/reports/",  admin_get_reports,   name="admin_get_reports"),
    path("api/admin/reports/<uuid:report_id>/",    admin_update_report, name="admin_update_report"),
    # Swagger / OpenAPI
    path("api/schema/", SpectacularAPIView.as_view(),                       name="schema"),
    path("api/docs/",   SpectacularSwaggerView.as_view(url_name="schema"),  name="swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)