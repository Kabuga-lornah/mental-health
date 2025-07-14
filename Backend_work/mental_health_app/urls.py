# Overwriting file: Backend_work/mental_health_app/urls.py
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
    TherapistSessionCreateView,
    SessionDetailUpdateView,
    ClientSessionListView,
    TherapistDetailView,
    PaymentCreateView,
    ClientPaymentStatusView,
    TherapistAvailabilityListCreateView,
    TherapistAvailabilityDetailView,
    TherapistAvailableSlotsView,
    MpesaCallbackView,
    AiRecommendationView,
    ChatWithGeminiView,
    ChatMessageListView,
    AdminUserListView,
    AdminSessionListView,
    AdminJournalEntryListView,
    AdminPaymentListView,
     TherapistChatRoomListView,
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

    # ADMIN DATA LISTING ENDPOINTS (NEWLY ADDED)
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/sessions/', AdminSessionListView.as_view(), name='admin-session-list'),
    path('admin/journal-entries/', AdminJournalEntryListView.as_view(), name='admin-journal-entry-list'),
    path('admin/payments/', AdminPaymentListView.as_view(), name='admin-payment-list'), 


    # THERAPIST & SESSION RELATED ENDPOINTS
    path('therapists/', TherapistListView.as_view(), name='therapist-list'),
    path('therapists/<int:pk>/', TherapistDetailView.as_view(), name='therapist-detail'),

    # NEW: Therapist Availability Management (for therapists to set their schedule)
    path('therapists/me/availability/', TherapistAvailabilityListCreateView.as_view(), name='therapist-availability-list-create'),
    path('therapists/me/availability/<int:pk>/', TherapistAvailabilityDetailView.as_view(), name='therapist-availability-detail'),

    # NEW: Client-facing endpoint to get available slots for a therapist
    path('therapists/<int:therapist_id>/available-slots/', TherapistAvailableSlotsView.as_view(), name='therapist-available-slots'),

    # SESSION REQUESTS (from clients to therapists)
    path('session-requests/', SessionRequestCreateView.as_view(), name='session-request-create'),
    path('therapist/session-requests/', TherapistSessionRequestListView.as_view(), name='therapist-session-requests'),
    path('client/session-requests/', ClientSessionRequestListView.as_view(), name='client-session-requests'),
    path('session-requests/<int:pk>/', SessionRequestUpdateView.as_view(), name='session-request-update'),

    # GET /api/therapist/sessions/ -> Lists all sessions for the therapist
    path('therapist/sessions/', TherapistSessionListView.as_view(), name='therapist-session-list'),

    # POST /api/therapist/sessions/create/ -> Creates a new session from a request
    path('therapist/sessions/create/', TherapistSessionCreateView.as_view(), name='session-create-from-request'),

    # PATCH /api/therapist/sessions/<id>/ -> Updates a session (add notes, complete)
    path('therapist/sessions/<int:pk>/', SessionDetailUpdateView.as_view(), name='session-detail-update'),

    # NEW: GET /api/client/sessions/ -> Lists all sessions for the client
    path('client/sessions/', ClientSessionListView.as_view(), name='client-session-list'),

    # NEW: Payment Endpoints
    path('payments/initiate/', PaymentCreateView.as_view(), name='payment-initiate'),
    path('payments/status/<int:therapist_id>/', ClientPaymentStatusView.as_view(), name='client-payment-status'),

    # NEW: M-Pesa Callback Endpoint
    path('mpesa/callback/', MpesaCallbackView, name='mpesa_callback'),

    # NEW: AI Endpoints
    path('ai/recommendations/', AiRecommendationView.as_view(), name='ai-recommendations'),
    path('ai/chat/', ChatWithGeminiView.as_view(), name='ai-chat'),
    path('chat/messages/<str:room_name>/', ChatMessageListView.as_view(), name='chat-message-list'),

    path('therapist/chat_rooms/', TherapistChatRoomListView.as_view(), name='therapist-chat-rooms'),

    
]