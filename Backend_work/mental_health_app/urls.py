# mental_health_app/urls.py
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserView, JournalEntryView, JournalEntryDetailView,
    TherapistListView, SessionRequestCreateView, TherapistSessionRequestListView,
    SessionRequestUpdateView,
    TherapistApplicationCreateView,
    MyTherapistApplicationView,
    AdminTherapistApplicationListView, AdminTherapistApplicationDetailView
)

urlpatterns = [
    # AUTHENTICATION & USER MANAGEMENT
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/', UserView.as_view(), name='user'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # JOURNAL ENTRIES
    path('journal/', JournalEntryView.as_view(), name='journal-list'),
    path('journal/<int:pk>/', JournalEntryDetailView.as_view(), name='journal-detail'),

    # THERAPIST APPLICATION ENDPOINTS (for regular users applying)
    path('therapist-applications/submit/', TherapistApplicationCreateView.as_view(), name='therapist-application-submit'),
    path('therapist-applications/me/', MyTherapistApplicationView.as_view(), name='my-therapist-application'),

    # ADMIN THERAPIST APPLICATION ENDPOINTS (only for is_staff, is_superuser)
    path('admin/therapist-applications/', AdminTherapistApplicationListView.as_view(), name='admin-therapist-applications-list'),
    path('admin/therapist-applications/<int:pk>/', AdminTherapistApplicationDetailView.as_view(), name='admin-therapist-applications-detail'),

    # THERAPIST & SESSION MANAGEMENT ENDPOINTS
    path('therapists/', TherapistListView.as_view(), name='therapist-list'),
    path('session-requests/', SessionRequestCreateView.as_view(), name='session-request-create'),
    path('therapist/session-requests/', TherapistSessionRequestListView.as_view(), name='therapist-session-requests'),
    
    # ADD THIS LINE - Alternative URL pattern for therapist sessions
    path('therapist/sessions/', TherapistSessionRequestListView.as_view(), name='therapist-sessions'),
    
    path('session-requests/<int:pk>/', SessionRequestUpdateView.as_view(), name='session-request-update'),
]