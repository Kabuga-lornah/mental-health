from django.urls import path, include  
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserView, JournalEntryView, JournalEntryDetailView,
    TherapistListView, SessionRequestCreateView, TherapistSessionRequestListView,
    SessionRequestUpdateView,
    TherapistApplicationCreateView, TherapistApplicationAdminListView, TherapistApplicationAdminDetailView # New views
)

urlpatterns = [
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/user/', UserView.as_view(), name='user'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/journal/', JournalEntryView.as_view(), name='journal-list'),
    path('api/journal/<int:pk>/', JournalEntryDetailView.as_view(), name='journal-detail'),

    # Therapist Application Endpoints
    path('api/therapist-applications/submit/', TherapistApplicationCreateView.as_view(), name='therapist-application-submit'),
    path('api/admin/therapist-applications/', TherapistApplicationAdminListView.as_view(), name='admin-therapist-application-list'),
    path('api/admin/therapist-applications/<int:pk>/', TherapistApplicationAdminDetailView.as_view(), name='admin-therapist-application-detail'),

    # Therapist & Session Management Endpoints (Modified to use is_verified)
    path('api/therapists/', TherapistListView.as_view(), name='therapist-list'),
    path('api/session-requests/', SessionRequestCreateView.as_view(), name='session-request-create'),
    path('api/therapist/session-requests/', TherapistSessionRequestListView.as_view(), name='therapist-session-requests'),
    path('api/session-requests/<int:pk>/', SessionRequestUpdateView.as_view(), name='session-request-update'),
]
