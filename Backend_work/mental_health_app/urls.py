from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserView, JournalEntryView, JournalEntryDetailView,
    TherapistListView, SessionRequestCreateView, TherapistSessionRequestListView,
    SessionRequestUpdateView, ClientSessionRequestListView, 
    TherapistApplicationCreateView,
    MyTherapistApplicationView,
    AdminTherapistApplicationListView, AdminTherapistApplicationDetailView,
    TherapistSessionListView,
    SessionCreateFromRequestView,
    SessionDetailUpdateView,
    ClientSessionListView,
    TherapistDetailView, 
    PaymentCreateView,
    ClientPaymentStatusView,
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

    # THERAPIST APPLICATION ENDPOINTS
    path('therapist-applications/submit/', TherapistApplicationCreateView.as_view(), name='therapist-application-submit'),
    path('therapist-applications/me/', MyTherapistApplicationView.as_view(), name='my-therapist-application'),

    # ADMIN THERAPIST APPLICATION ENDPOINTS
    path('admin/therapist-applications/', AdminTherapistApplicationListView.as_view(), name='admin-therapist-applications-list'),
    path('admin/therapist-applications/<int:pk>/', AdminTherapistApplicationDetailView.as_view(), name='admin-therapist-applications-detail'),

    # SESSION REQUESTS (from clients to therapists)
    path('therapists/', TherapistListView.as_view(), name='therapist-list'),
    path('therapists/<int:pk>/', TherapistDetailView.as_view(), name='therapist-detail'), 
    path('session-requests/', SessionRequestCreateView.as_view(), name='session-request-create'),
    path('therapist/session-requests/', TherapistSessionRequestListView.as_view(), name='therapist-session-requests'),
    path('client/session-requests/', ClientSessionRequestListView.as_view(), name='client-session-requests'),
    path('session-requests/<int:pk>/', SessionRequestUpdateView.as_view(), name='session-request-update'),

    # GET /api/therapist/sessions/ -> Lists all sessions for the therapist
    path('therapist/sessions/', TherapistSessionListView.as_view(), name='therapist-session-list'),
    
    # POST /api/therapist/sessions/create/ -> Creates a new session from a request
    path('therapist/sessions/create/', SessionCreateFromRequestView.as_view(), name='session-create-from-request'),
    
    # PATCH /api/therapist/sessions/<id>/ -> Updates a session (add notes, complete)
    path('therapist/sessions/<int:pk>/', SessionDetailUpdateView.as_view(), name='session-detail-update'),

    # NEW: GET /api/client/sessions/ -> Lists all sessions for the client
    path('client/sessions/', ClientSessionListView.as_view(), name='client-session-list'),

    # NEW: Payment Endpoints
    path('payments/initiate/', PaymentCreateView.as_view(), name='payment-initiate'),
    path('payments/status/<int:therapist_id>/', ClientPaymentStatusView.as_view(), name='client-payment-status'),
]