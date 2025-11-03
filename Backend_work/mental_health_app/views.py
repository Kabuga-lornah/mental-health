# Overwriting file: Backend_work/mental_health_app/views.py
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied
from django.conf import settings
import requests
import base64
from datetime import datetime
import json
from datetime import time, timedelta
from collections import defaultdict
import time as raw_time
from django.db import transaction
from rest_framework.permissions import IsAuthenticated


# NEW: Imports for Gemini API
import google.generativeai as genai
from googleapiclient.discovery import build # For YouTube Data API

from .models import JournalEntry, SessionRequest, TherapistApplication, User, Session, Payment, TherapistAvailability, ChatMessage, ChatRoom
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView # Import APIView

User = get_user_model()

from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, TherapistSerializer,
    JournalEntrySerializer, JournalListSerializer, SessionRequestSerializer,
    SessionRequestUpdateSerializer, SessionSerializer, TherapistApplicationSerializer,
    TherapistApplicationAdminSerializer, PaymentSerializer,
    TherapistAvailabilitySerializer, ChatMessageSerializer, ChatRoomSerializer, UserChatDetailSerializer
)

# --- Initialize Gemini API (NEW) ---
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    # CHANGE IS HERE: Changed 'gemini-pro' to 'gemini-1.0-pro'
    gemini_model = genai.GenerativeModel('gemini-1.0-pro') # Using gemini-1.0-pro for text generation
    # You might use 'gemini-pro-vision' for multimodal, but 'gemini-1.0-pro' is good for text
else:
    print("WARNING: GEMINI_API_KEY not found in settings. AI features will be disabled.")
    gemini_model = None

# --- Initialize YouTube Data API (NEW) ---
youtube_service = None
if settings.YOUTUBE_API_KEY:
    try:
        youtube_service = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)
    except Exception as e:
        print(f"WARNING: Could not build YouTube service: {e}. YouTube video search might not work.")
else:
    print("WARNING: YOUTUBE_API_KEY not found in settings. YouTube video search features will be limited.")


def generate_mpesa_access_token():
    consumer_key = settings.MPESA_CONSUMER_KEY
    consumer_secret = settings.MPESA_CONSUMER_SECRET
    api_url = f"{settings.MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials"

    try:
        response = requests.get(
            api_url,
            auth=(consumer_key, consumer_secret),
            timeout=10
        )
        response.raise_for_status()
        token = response.json()['access_token']
        print(f"DEBUG: M-Pesa access token generated successfully.")
        return token
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Error generating M-Pesa access token: {e}")
        return None

def initiate_stk_push(phone_number, amount, account_reference, transaction_desc, callback_url):
    access_token = generate_mpesa_access_token()
    if not access_token:
        print("ERROR: STK Push failed - No M-Pesa access token.")
        return {"success": False, "message": "Failed to get M-Pesa access token."}

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode(
        f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
    ).decode('utf-8')

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": phone_number,
        "PartyB": settings.MPESA_SHORTCODE,
        "PhoneNumber": phone_number,
        "CallBackURL": callback_url,
        "AccountReference": account_reference,
        "TransactionDesc": transaction_desc
    }

    print(f"DEBUG: M-Pesa STK Push Payload to be sent: {json.dumps(payload, indent=2)}")
    print(f"DEBUG: CallBackURL being sent to M-Pesa: {callback_url}")

    try:
        response = requests.post(f"{settings.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest", json=payload, headers=headers, timeout=20)
        response.raise_for_status() # This will raise HTTPError for 4xx/5xx responses
        response_data = response.json()
        print(f"DEBUG: M-Pesa STK Push Raw Response: {json.dumps(response_data, indent=2)}")

        if response_data.get('ResponseCode') == '0':
            print(f"INFO: STK Push initiated successfully for CheckoutRequestID: {response_data.get('CheckoutRequestID')}")
            return {
                "success": True,
                "message": "STK Push initiated successfully.",
                "checkout_request_id": response_data.get('CheckoutRequestID'),
                "merchant_request_id": response_data.get('MerchantRequestID')
            }
        else:
            # M-Pesa API returned a non-zero ResponseCode (business logic error from Safaricom)
            print(f"ERROR: STK Push initiation failed (M-Pesa ResponseCode: {response_data.get('ResponseCode')}): {response_data.get('ResponseDescription', 'No description')}, CustomerMessage: {response_data.get('CustomerMessage', 'No customer message')}")
            return {
                "success": False,
                "message": response_data.get('ResponseDescription', 'STK Push initiation failed.'),
                "error_code": response_data.get('ResponseCode'),
                "error_message": response_data.get('CustomerMessage') # This often has the more specific message
            }
    except requests.exceptions.HTTPError as e:
        # This catches 4xx/5xx HTTP errors (e.g., 400 Bad Request)
        print(f"ERROR: HTTP Error initiating STK Push: {e.response.status_code} - {e.response.text}")
        try:
            error_details = e.response.json()
            print(f"ERROR: M-Pesa API Error Details (JSON): {json.dumps(error_details, indent=2)}")
            # Look for specific error messages like 'errorMessage' or 'DeveloperMessage'
            return {"success": False, "message": error_details.get('errorMessage', 'STK Push API HTTP error.')}
        except json.JSONDecodeError:
            print(f"ERROR: STK Push API returned non-JSON error response: {e.response.text}")
            return {"success": False, "message": f"STK Push API returned non-JSON error: {e.response.text}"}
    except requests.exceptions.RequestException as e:
        # This catches network errors, timeouts, etc.
        print(f"ERROR: Network or other Request Error initiating STK Push: {e}")
        return {"success": False, "message": f"Network or API error: {e}"}

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_staff and request.user.is_superuser

# In RegisterView and LoginView
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone,
                    'is_therapist': user.is_therapist,
                    'is_verified': user.is_verified,
                    'is_available': user.is_available,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'hourly_rate': user.hourly_rate,
                    'bio': user.bio,
                    'years_of_experience': user.years_of_experience,
                    'specializations': user.specializations,
                    # FIX: Removed .url from user.profile_picture
                    'profile_picture': user.profile_picture if user.profile_picture else None,
                    'license_credentials': user.license_credentials,
                    'approach_modalities': user.approach_modalities,
                    'languages_spoken': user.languages_spoken,
                    'client_focus': user.client_focus,
                    'insurance_accepted': user.insurance_accepted,
                    'video_introduction_url': user.video_introduction_url,
                    'is_free_consultation': user.is_free_consultation,
                    'session_modes': user.session_modes,
                    'physical_address': user.physical_address,
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            if hasattr(e, 'detail'):
                return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone,
                    'is_therapist': user.is_therapist,
                    'is_verified': user.is_verified,
                    'is_available': user.is_available,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'hourly_rate': user.hourly_rate,
                    'bio': user.bio,
                    'years_of_experience': user.years_of_experience,
                    'specializations': user.specializations,
                    # FIX: Removed .url from user.profile_picture
                    'profile_picture': user.profile_picture if user.profile_picture else None,
                    'license_credentials': user.license_credentials,
                    'approach_modalities': user.approach_modalities,
                    'languages_spoken': user.languages_spoken,
                    'client_focus': user.client_focus,
                    'insurance_accepted': user.insurance_accepted,
                    'video_introduction_url': user.video_introduction_url,
                    'is_free_consultation': user.is_free_consultation,
                    'session_modes': user.session_modes,
                    'physical_address': user.physical_address,
                }
            })
        except Exception as e:
            if hasattr(e, 'detail'):
                return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_update(self, serializer):
        if 'profile_picture' in self.request.FILES:
            serializer.save(profile_picture=self.request.FILES['profile_picture'])
        else:
            serializer.save()

# New Admin Views
class AdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer  # Using UserSerializer for full user details
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by('email') # Order for consistent display
    def get_serializer_context(self):
        return {'request': self.request}

class AdminSessionListView(generics.ListAPIView):
    serializer_class = SessionSerializer
    permission_classes = [IsAdminUser]
    queryset = Session.objects.all().order_by('-session_date', '-session_time')

class AdminJournalEntryListView(generics.ListAPIView):
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAdminUser]
    queryset = JournalEntry.objects.all().order_by('-date')

class AdminPaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminUser]
    queryset = Payment.objects.all().order_by('-payment_date')

class JournalEntryView(generics.ListCreateAPIView):
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = JournalEntry.objects.filter(user=self.request.user)

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])

        mood = self.request.query_params.get('mood')
        if mood:
            queryset = queryset.filter(mood__iexact=mood)

        return queryset.order_by('-date')

    def perform_create(self, serializer):
        attachment_file = self.request.FILES.get('attachment_file')
        if attachment_file:
            serializer.save(
                user=self.request.user,
                attachment_name=attachment_file.name,
                attachment_file=attachment_file
            )
        else:
            serializer.save(user=self.request.user)

class JournalEntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return JournalEntry.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        attachment_file = self.request.FILES.get('attachment_file')
        if attachment_file:
            serializer.save(
                attachment_name=attachment_file.name,
                attachment_file=attachment_file
            )
        else:
            serializer.save()

class TherapistApplicationCreateView(generics.CreateAPIView):
    serializer_class = TherapistApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if TherapistApplication.objects.filter(applicant=self.request.user).exists():
            raise serializers.ValidationError({"detail": "You have already submitted a therapist application."})
        user = self.request.user
        if not user.is_therapist:
            user.is_therapist = True
            user.save()

        application = serializer.save(applicant=self.request.user)

class MyTherapistApplicationView(generics.RetrieveAPIView):
    serializer_class = TherapistApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(TherapistApplication, applicant=self.request.user)

class AdminTherapistApplicationListView(generics.ListAPIView):
    serializer_class = TherapistApplicationAdminSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return TherapistApplication.objects.all().order_by('-submitted_at')

class AdminTherapistApplicationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = TherapistApplicationAdminSerializer
    permission_classes = [IsAdminUser]
    queryset = TherapistApplication.objects.all()

    def perform_update(self, serializer):
        instance = serializer.save()

        if instance.status == 'approved':
            user = instance.applicant
            user.is_therapist = True
            user.is_verified = True
            user.is_available = True

            user.bio = instance.motivation_statement
            user.specializations = instance.specializations
            user.years_of_experience = instance.years_of_experience
            user.license_credentials = instance.license_credentials
            user.approach_modalities = instance.approach_modalities
            user.languages_spoken = instance.languages_spoken
            user.client_focus = instance.client_focus
            user.insurance_accepted = instance.insurance_accepted
            user.is_free_consultation = instance.is_free_consultation
            user.session_modes = instance.session_modes
            user.physical_address = instance.physical_address

            if instance.professional_photo:
                user.profile_picture = instance.professional_photo

            if not instance.is_free_consultation and instance.hourly_rate is not None:
                user.hourly_rate = instance.hourly_rate
            elif instance.is_free_consultation:
                user.hourly_rate = None

            user.save()
        else:
            user_applicant = instance.applicant
            if user_applicant.is_verified:
                user_applicant.is_verified = False
                user_applicant.is_available = False
                user_applicant.save()

class TherapistListView(generics.ListAPIView):
    serializer_class = TherapistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.filter(is_therapist=True, is_available=True, is_verified=True)

        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(email__icontains=search_query)
            )

        specialization_filter = self.request.query_params.get('specialization')
        if specialization_filter:
            queryset = queryset.filter(specializations__icontains=specialization_filter)

        pricing_type = self.request.query_params.get('pricing_type')
        if pricing_type == 'free':
            queryset = queryset.filter(is_free_consultation=True)
        elif pricing_type == 'paid':
            queryset = queryset.filter(is_free_consultation=False)
            min_hourly_rate = self.request.query_params.get('min_hourly_rate')
            max_hourly_rate = self.request.query_params.get('max_hourly_rate')
            if min_hourly_rate:
                queryset = queryset.filter(hourly_rate__gte=float(min_hourly_rate))
            if max_hourly_rate:
                queryset = queryset.filter(hourly_rate__lte=float(max_hourly_rate))
        
        session_mode_filter = self.request.query_params.get('session_modes')
        if session_mode_filter:
            if session_mode_filter == 'online':
                queryset = queryset.filter(Q(session_modes='online') | Q(session_modes='both'))
            elif session_mode_filter == 'physical':
                queryset = queryset.filter(Q(session_modes='physical') | Q(session_modes='both'))
            elif session_mode_filter == 'both':
                queryset = queryset.filter(session_modes='both') # If 'both' is chosen, only show those explicitly marked 'both'

        return queryset.order_by('last_name', 'first_name')

    def get_serializer_context(self):
        return {'request': self.request}

class TherapistDetailView(generics.RetrieveAPIView):
    serializer_class = TherapistSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.filter(is_therapist=True, is_verified=True)
    def get_serializer_context(self):
        return {'request': self.request}

class SessionRequestCreateView(generics.CreateAPIView):
    serializer_class = SessionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _is_slot_available(self, therapist, requested_date, requested_time, session_duration_minutes):
        day_of_week = requested_date.strftime('%A')
        availability = TherapistAvailability.objects.filter(
            therapist=therapist, day_of_week=day_of_week
        ).first()

        scheduled_sessions_on_date = Session.objects.none()
        paid_pending_requests_on_date = SessionRequest.objects.none()

        if not availability:
            print(f"DEBUG: Slot check - No specific availability found for {day_of_week}. Using default.")
            default_start_time = time(9, 0)
            default_end_time = time(17, 0)
            default_slot_duration = 60

            class DefaultAvailability:
                def __init__(self, start, end, duration):
                    self.start_time = start
                    self.end_time = end
                    self.slot_duration = duration
                    self.break_start_time = None
                    self.break_end_time = None
            availability = DefaultAvailability(default_start_time, default_end_time, default_slot_duration)

            if day_of_week in ['Saturday', 'Sunday']:
                print(f"DEBUG: Slot check - Default availability for weekend day {day_of_week} is not allowed.")
                return False, "Therapist is not available on weekends by default."


        slot_start_dt = timezone.make_aware(datetime.combine(requested_date, requested_time))
        slot_end_dt = slot_start_dt + timedelta(minutes=session_duration_minutes)
        working_start_dt = timezone.make_aware(datetime.combine(requested_date, availability.start_time))
        working_end_dt = timezone.make_aware(datetime.combine(requested_date, availability.end_time))

        if not (working_start_dt <= slot_start_dt and slot_end_dt <= working_end_dt):
            print(f"DEBUG: Slot check - Slot {slot_start_dt.time()}-{slot_end_dt.time()} outside working hours {working_start_dt.time()}-{working_end_dt.time()}")
            return False, "Requested slot is outside therapist's working hours."

        if availability.break_start_time and availability.break_end_time:
            break_start_dt = timezone.make_aware(datetime.combine(requested_date, availability.break_start_time))
            break_end_dt = timezone.make_aware(datetime.combine(requested_date, availability.break_end_time))
            if not (slot_end_dt <= break_start_dt or slot_start_dt >= break_end_dt):
                print(f"DEBUG: Slot check - Slot {slot_start_dt.time()}-{slot_end_dt.time()} overlaps with break {break_start_dt.time()}-{break_end_dt.time()}")
                return False, "Requested slot overlaps with therapist's break."

        scheduled_sessions_on_date = Session.objects.filter(
            therapist=therapist,
            session_date=requested_date
        ).values('session_date', 'session_time', 'duration_minutes')

        paid_pending_requests_on_date = SessionRequest.objects.filter(
            therapist=therapist,
            status__in=['pending', 'accepted'],
            is_paid=True,
            requested_date=requested_date
        ).values('requested_date', 'requested_time', 'session_duration')

        for session in scheduled_sessions_on_date: # FIX: Change 'scheduled_sessions' to 'scheduled_sessions_on_date'
            session_date_obj = session['session_date']
            # Ensure session_date_obj is a date object, converting if it's a string
            if isinstance(session_date_obj, str):
                try:
                    session_date_obj = datetime.strptime(session_date_obj, '%Y-%m-%d').date()
                except ValueError:
                    print(f"WARNING: Could not parse session_date '{session_date_obj}'. Skipping session.")
                    continue # Skip this session if date format is unexpected

            booked_start_time = session['session_time']
            booked_duration = session.get('duration_minutes', 120)
            booked_start_dt = timezone.make_aware(datetime.combine(session_date_obj, booked_start_time))
            booked_end_dt = booked_start_dt + timedelta(minutes=booked_duration)
            if not (slot_end_dt <= booked_start_dt or slot_start_dt >= booked_end_dt):
                print(f"DEBUG: Slot check - Slot {slot_start_dt.time()}-{slot_end_dt.time()} conflicts with scheduled session {booked_start_dt.time()}-{booked_end_dt.time()}")
                return False, "Requested slot is already booked."

        for req in paid_pending_requests_on_date: # FIX: Change 'paid_pending_requests' to 'paid_pending_requests_on_date'
            req_date_obj = req['requested_date']
            # Ensure req_date_obj is a date object, converting if it's a string
            if isinstance(req_date_obj, str):
                try:
                    req_date_obj = datetime.strptime(req_date_obj, '%Y-%m-%d').date()
                except ValueError:
                    print(f"WARNING: Could not parse requested_date '{req_date_obj}'. Skipping request.")
                    continue # Skip this request if date format is unexpected

            booked_start_time = req['requested_time']
            booked_duration = req.get('session_duration', 120)
            booked_start_dt = timezone.make_aware(datetime.combine(req_date_obj, booked_start_time))
            booked_end_dt = booked_start_dt + timedelta(minutes=booked_duration)

            if not (slot_end_dt <= booked_start_dt or slot_start_dt >= booked_end_dt):
                print(f"DEBUG: Slot check - Slot {slot_start_dt.time()}-{slot_end_dt.time()} conflicts with paid pending request {booked_start_dt.time()}-{booked_end_dt.time()}")
                return False, "Requested slot is currently pending payment confirmation for another user."


        if slot_start_dt <= timezone.now():
            print(f"DEBUG: Slot check - Slot {slot_start_dt} is in the past compared to {timezone.now()}") # Corrected variable name here
            return False, "Cannot book a session in the past or current time."

        print(f"DEBUG: Slot check - Slot {slot_start_dt.time()}-{slot_end_dt.time()} is AVAILABLE.")
        return True, "Slot is available."


    def create(self, request, *args, **kwargs):
        therapist_id = request.data.get('therapist')
        requested_date_str = request.data.get('requested_date')
        requested_time_str = request.data.get('requested_time')
        session_duration = request.data.get('session_duration')

        if not therapist_id or not requested_date_str or not requested_time_str or not session_duration:
            return Response({"error": "Therapist, requested date, time, and session duration are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            therapist = User.objects.get(id=therapist_id, is_therapist=True, is_verified=True)
            requested_date = datetime.strptime(requested_date_str, '%Y-%m-%d').date()
            requested_time = datetime.strptime(requested_time_str, '%H:%M').time()
            session_duration = int(session_duration)
        except User.DoesNotExist:
            return Response({"error": "Therapist not found or not verified."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({"error": "Invalid date, time, or duration format. Use '%Y-%m-%d', '%H:%M', and integer for duration."}, status=status.HTTP_400_BAD_REQUEST)


        if self.request.user == therapist:
            raise serializers.ValidationError(
                {"therapist": "You cannot request a session with yourself."}
            )

        is_available, availability_message = self._is_slot_available(therapist, requested_date, requested_time, session_duration)
        if not is_available:
            return Response({"detail": availability_message}, status=status.HTTP_400_BAD_REQUEST)

        existing_request = SessionRequest.objects.filter(
            client=self.request.user,
            status__in=['pending', 'accepted']
        ).exists()

        existing_session = Session.objects.filter(
            client=self.request.user,
            status='scheduled'
        ).exists()

        if existing_request:
            requests_found = SessionRequest.objects.filter(client=self.request.user, status__in=['pending', 'accepted'])
            print(f"DEBUG: SessionRequestCreateView - Actual pending/accepted requests: {[f'ID: {r.id}, Status: {r.status}, Date: {r.requested_date}' for r in requests_found]}")

        if existing_session:
            sessions_found = Session.objects.filter(client=self.request.user, status='scheduled')
            print(f"DEBUG: SessionRequestCreateView - Actual scheduled sessions: {[f'ID: {s.id}, Status: {s.status}, Date: {s.session_date}' for s in sessions_found]}")


        if existing_request or existing_session:
            return Response(
                {"detail": "You already have a pending request or an active scheduled session. Please complete it before requesting a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data={
            'therapist': therapist_id,
            'requested_date': requested_date_str,
            'requested_time': requested_time_str,
            'message': request.data.get('message'),
            'session_duration': session_duration
        })
        serializer.is_valid(raise_exception=True)

        # --- MODIFICATION START ---
        # Set is_paid to True if it's a free consultation
        is_paid_status_for_request = therapist.is_free_consultation

        session_request_instance = serializer.save(
            client=self.request.user,
            therapist=therapist,
            is_paid=is_paid_status_for_request, # is_paid=True if free consultation, else False
            status='pending' # Always pending initially
        )
        # --- MODIFICATION END ---

        return Response({
            "message": "Session request created successfully. Proceed to payment to confirm your booking." if not is_paid_status_for_request else "Session request submitted for free consultation. Therapist will review.",
            "session_request_id": session_request_instance.id,
            "therapist_hourly_rate": therapist.hourly_rate if not therapist.is_free_consultation else 0,
            "is_free_consultation": therapist.is_free_consultation
        }, status=status.HTTP_201_CREATED)


class TherapistSessionCreateView(generics.CreateAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        request_id = request.data.get('session_request')
        session_request = get_object_or_404(SessionRequest, id=request_id)

        if request.user != session_request.therapist:
            return Response({'error': 'You are not authorized to accept this request.'}, status=status.HTTP_403_FORBIDDEN)

        if not session_request.is_paid:
            return Response({'error': 'Cannot create a session for an unpaid request.'}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(session_request, 'session'):
             return Response({'error': 'A session has already been created for this request.'}, status=status.HTTP_400_BAD_REQUEST)

        # --- MODIFICATION START ---
        # Determine session_type and location based on therapist's session_modes
        therapist_session_modes = session_request.therapist.session_modes
        session_type = 'online' # Default to online
        location = None

        if therapist_session_modes == 'physical':
            session_type = 'physical'
            location = session_request.therapist.physical_address
        elif therapist_session_modes == 'both':
            # For 'both', we can default to online or check request message for preference
            # For simplicity, let's keep it online by default if 'both' is chosen,
            # unless request explicitly states physical (which isn't in current request data)
            # Or, we can set session_type to 'physical' and location if therapist has one.
            # Let's align it with what the therapist *offers* for the session type.
            # If the request doesn't specify preference, online is safer for 'both'
            # However, the user wants it to reflect what the therapist *offers*.
            # Let's ensure the session type is set to reflect the mode requested/offered
            # A more robust solution might involve the client specifying preference during request.
            # For now, let's use the therapist's default if not specified in request, or if 'both', default online.
            # If 'both', and a physical address exists, we'll assume it can be physical.
            if session_request.therapist.physical_address:
                # If therapist offers both and has a physical address, let's assume it can be physical
                # This logic is simplified; in a real app, client would choose.
                session_type = 'physical'
                location = session_request.therapist.physical_address
            # If therapist offers 'both' but no physical address, it defaults to online which is fine.


        # Set session request status to accepted
        session_request.status = 'accepted'
        session_request.save()

        session_data = {
            'session_request': session_request.id,
            'client': session_request.client.id,
            'therapist': session_request.therapist.id,
            'session_date': session_request.requested_date,
            'session_time': session_request.requested_time,
            'duration_minutes': session_request.session_duration,
            'session_type': session_type, # Use determined session_type
            'location': location,       # Use determined location
            'zoom_meeting_url': request.data.get('zoom_meeting_url', None), # Still allow override for Zoom
            'status': 'scheduled'
        }
        # --- MODIFICATION END ---

        serializer = self.get_serializer(data=session_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class TherapistSessionRequestListView(generics.ListAPIView):
    serializer_class = SessionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_therapist or not self.request.user.is_verified:
            return SessionRequest.objects.none()

        status_filter = self.request.query_params.get('status')
        # --- MODIFICATION START ---
        # Explicitly filter for 'pending' status for new session requests.
        # If a specific status is requested via query param, honor it.
        # Otherwise, default to showing only 'pending' requests as 'new'.
        queryset = SessionRequest.objects.filter(
            therapist=self.request.user,
            is_paid=True # Only show requests that are 'paid' (including free ones)
        )

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        else:
            # Default for "new session requests" should only be pending ones
            queryset = queryset.filter(status='pending')
        # --- MODIFICATION END ---

        return queryset.order_by('-created_at')

class ClientSessionRequestListView(generics.ListAPIView):
    serializer_class = SessionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        status_filter = self.request.query_params.get('status')
        # --- MODIFICATION START ---
        # Only show requests if they are paid or if the therapist offers free consultation.
        queryset = SessionRequest.objects.filter(
            client=self.request.user
        ).filter(
            is_paid=True # This now correctly covers both truly paid and 'free' consultations
        )
        # --- MODIFICATION END ---

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-created_at')

class SessionRequestDetailView(generics.RetrieveAPIView):
    serializer_class = SessionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SessionRequest.objects.filter(
            Q(client=self.request.user) | Q(therapist=self.request.user)
        )

class SessionRequestUpdateView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SessionRequestUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SessionRequest.objects.filter(
            Q(client=self.request.user) | Q(therapist=self.request.user)
        )

    def perform_update(self, serializer):
        instance = serializer.save()

    def perform_destroy(self, instance):
        if instance.status == 'pending' and instance.client == self.request.user:
            instance.status = 'cancelled'
            instance.save()
        else:
            raise permissions.PermissionDenied(
                "You can only cancel pending requests that you have created."
            )

class TherapistSessionListView(generics.ListAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Start with all sessions for the therapist
        queryset = Session.objects.filter(therapist=self.request.user)

        # Get the 'status' query parameter from the request
        status_filter = self.request.query_params.get('status')

        # If a status filter is provided, apply it to the queryset
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Order the results
        return queryset.order_by('-session_date', '-session_time')

class SessionDetailUpdateView(generics.UpdateAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Session.objects.all()

    def get_object(self):
        obj = super().get_object()
        if self.request.user != obj.therapist:
            raise PermissionDenied("You do not have permission to edit this session.")
        return obj

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Store the original status before performing the update
        original_status = instance.status
        
        self.perform_update(serializer) # This line saves the session with the new status

        # After the session is updated, check if its status just transitioned to 'completed'
        # This is where the magic happens for the SessionRequest status update
        if original_status != 'completed' and instance.status == 'completed':
            # If yes, update the status of the associated SessionRequest to 'completed'
            session_request = instance.session_request
            if session_request and session_request.status != 'completed': # Avoid redundant updates
                session_request.status = 'completed'
                session_request.save()
                print(f"DEBUG: SessionRequest {session_request.id} status updated to 'completed' after session completion.")


        if getattr(instance, '_prefetched_objects_cache', None):
            instance = self.get_object()
            serializer = self.get_serializer(instance)

        return Response(serializer.data)

class ClientSessionListView(generics.ListAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Session.objects.filter(client=self.request.user)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-session_date', '-session_time')

class PaymentCreateView(generics.CreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        session_request_id = request.data.get('session_request_id')
        mpesa_phone_number = request.data.get('mpesa_phone_number')

        if not session_request_id or not mpesa_phone_number:
            return Response({"error": "Session request ID and M-Pesa phone number are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Only allow payment initiation for requests that are not yet 'paid'
            session_request_obj = SessionRequest.objects.get(id=session_request_id, client=request.user, status='pending', is_paid=False)
        except SessionRequest.DoesNotExist:
            return Response({"error": "Session request not found, not pending, or already paid."}, status=status.HTTP_404_NOT_FOUND)

        therapist = session_request_obj.therapist
        amount = therapist.hourly_rate if not therapist.is_free_consultation else 0

        if amount <= 0:
            return Response({"error": "Payment is not required for this session (free consultation or therapist has no hourly rate)."}, status=status.HTTP_400_BAD_REQUEST)

        if not mpesa_phone_number.startswith('254') or not mpesa_phone_number[3:].isdigit() or len(mpesa_phone_number) != 12:
            return Response({"error": "Invalid M-Pesa phone number format. Must start with '254' and be 12 digits long (e.g., 254712345678)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount_int = int(float(amount))
            if amount_int <= 0:
                raise ValueError("Amount must be a positive number.")
        except (ValueError, TypeError):
            return Response({"error": "Invalid amount. Must be a positive number."}, status=status.HTTP_400_BAD_REQUEST)

        if Payment.objects.filter(session_request=session_request_obj).exists():
            return Response({"error": "A payment for this session request has already been initiated or completed."}, status=status.HTTP_400_BAD_REQUEST)

        callback_url = f"{settings.MPESA_STK_CALLBACK_URL}"
        account_reference = f"TherapySession_{request.user.id}_{therapist.id}_{session_request_obj.id}_{timezone.now().timestamp()}"
        transaction_desc = f"Payment for session request {session_request_obj.id} with {therapist.first_name} {therapist.last_name}"

        stk_response = initiate_stk_push(
            phone_number=mpesa_phone_number,
            amount=amount_int,
            account_reference=account_reference,
            transaction_desc=transaction_desc,
            callback_url=callback_url
        )

        if stk_response["success"]:
            # --- MODIFICATION START ---
            # Mark the session request as paid immediately upon successful STK push initiation
            # This is correct if is_paid means "payment handled/not required".
            # The actual payment status is in the Payment model.
            session_request_obj.is_paid = True
            session_request_obj.save()
            print(f"DEBUG: SessionRequest {session_request_obj.id} marked as paid upon STK Push initiation (meaning payment is now being handled/is not required).")
            # --- MODIFICATION END ---

            payment_data = {
                'client': self.request.user.id,
                'therapist': therapist.id,
                'amount': amount_int,
                'status': 'pending', # The payment record itself is still 'pending' until callback
                'transaction_id': stk_response.get('merchant_request_id'),
                'checkout_request_id': stk_response.get('checkout_request_id'),
                'session_request': session_request_obj.id
            }
            serializer = self.get_serializer(data=payment_data)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                payment_instance = serializer.save()
                print(f"DEBUG: Payment record created/updated. ID: {payment_instance.id}, CheckoutRequestID: {payment_instance.checkout_request_id}, Status: {payment_instance.status}")


            return Response({
                "message": "M-Pesa STK Push initiated. Please check your phone to complete the payment.",
                "checkout_request_id": stk_response.get('checkout_request_id'),
                "session_request_id": session_request_obj.id
            }, status=status.HTTP_200_OK)
        else:
            # If STK push initiation fails, the session_request.is_paid should revert
            if session_request_obj.is_paid:
                session_request_obj.is_paid = False
                session_request_obj.save()
                print(f"DEBUG: SessionRequest {session_request_obj.id} reverted to unpaid due to STK Push failure.")

            return Response({"error": stk_response["message"]}, status=status.HTTP_400_BAD_REQUEST)

class ClientPaymentStatusView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        therapist_id = self.kwargs.get('therapist_id')
        session_request_id = request.query_params.get('session_request_id')

        if not therapist_id and not session_request_id:
            return Response({"error": "Therapist ID or Session Request ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        if session_request_id:
            try:
                session_request = SessionRequest.objects.get(id=session_request_id, client=request.user)
                has_paid = Payment.objects.filter(session_request=session_request, status='completed').exists()
                return Response({"has_paid": has_paid})
            except SessionRequest.DoesNotExist:
                return Response({"error": "Session request not found for current user."}, status=status.HTTP_404_NOT_FOUND)
        elif therapist_id:
            try:
                therapist = User.objects.get(id=therapist_id, is_therapist=True, is_verified=True)
            except User.DoesNotExist:
                return Response({"error": "Therapist not found or not verified."}, status=status.HTTP_404_NOT_FOUND)

            has_paid = Payment.objects.filter(
                client=request.user,
                therapist=therapist,
                status='completed',
                session_request__isnull=True
            ).exists()
            return Response({"has_paid": has_paid})


@api_view(['POST'])
@permission_classes([AllowAny])
def MpesaCallbackView(request):
    """
    Handles M-Pesa STK Push callbacks.
    """
    print("M-Pesa Callback received!")
    print(f"Request data: {json.dumps(request.data, indent=2)}")

    try:
        body = request.data.get('Body')
        stk_callback = body.get('stkCallback')

        if not stk_callback:
            print("ERROR: Invalid M-Pesa callback format: missing stkCallback.")
            return Response({"message": "Invalid M-Pesa callback format."}, status=status.HTTP_400_BAD_REQUEST)

        merchant_request_id = stk_callback.get('MerchantRequestID')
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')

        callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])

        mpesa_receipt_number = None
        amount = None
        phone_number = None

        for item in callback_metadata:
            if item.get('Name') == 'MpesaReceiptNumber':
                mpesa_receipt_number = item.get('Value')
            elif item.get('Name') == 'Amount':
                amount = item.get('Value')
            elif item.get('Name') == 'PhoneNumber':
                phone_number = item.get('Value')

        print(f"DEBUG: Callback Details: MerchantRequestID={merchant_request_id}, CheckoutRequestID={checkout_request_id}, ResultCode={result_code}, MpesaReceiptNumber={mpesa_receipt_number}")

        payment = None
        max_retries = 10 # Increased retries
        retry_delay_seconds = 2 
       
       # --- MODIFICATION START ---
        for i in range(max_retries):
            try:
                with transaction.atomic():
                    payment = Payment.objects.select_for_update().get(checkout_request_id=checkout_request_id)
                    print(f"DEBUG: Found Payment record for CheckoutRequestID: {checkout_request_id} on attempt {i+1}.")
                    break
            except Payment.DoesNotExist:
                print(f"DEBUG: Payment not found for CheckoutRequestID: {checkout_request_id}. Retrying in {retry_delay_seconds} second(s)... (Attempt {i+1}/{max_retries})")
                raw_time.sleep(retry_delay_seconds)
            except Exception as e:
                print(f"ERROR: Error during payment lookup (attempt {i+1}): {e}")
                raw_time.sleep(retry_delay_seconds)
        # --- MODIFICATION END ---

        if not payment:
            print(f"CRITICAL ERROR: Payment record still not found after {max_retries} attempts for CheckoutRequestID: {checkout_request_id}. Callback cannot be processed.")
            # It's important to return a non-200 status code here so M-Pesa retries later if possible
            return Response({"message": "Payment record not found after multiple attempts. Will retry later."}, status=status.HTTP_404_NOT_FOUND)

        if result_code == 0:
            payment.status = 'completed'
            payment.mpesa_receipt_number = mpesa_receipt_number
            payment.transaction_id = mpesa_receipt_number # Use receipt number as transaction ID for consistency
            payment.save()
            print(f"INFO: Payment for {checkout_request_id} updated to 'completed'. MpesaReceiptNumber: {mpesa_receipt_number}")

            if payment.session_request:
                payment.session_request.is_paid = True # Redundant but safe
                payment.session_request.save()
                print(f"INFO: SessionRequest {payment.session_request.id} marked as paid.")

            return Response({"message": "Payment successful and updated."}, status=status.HTTP_200_OK)
        else:
            payment.status = 'failed'
            # Safaricom's result_desc and customerMessage can be helpful here
            payment.reviewer_notes = result_desc
            payment.save()
            print(f"WARNING: Payment for {checkout_request_id} updated to 'failed'. ResultCode: {result_code}, Reason: {result_desc}")

            if payment.session_request:
                payment.session_request.is_paid = False # Set back to False
                payment.session_request.status = 'cancelled' # Cancel session request on payment failure
                payment.session_request.save()
                print(f"INFO: SessionRequest {payment.session_request.id} cancelled due to payment failure.")

            return Response({"message": "Payment failed or cancelled."}, status=status.HTTP_200_OK) # Still 200 OK for M-Pesa to stop retrying

    except json.JSONDecodeError as e:
        print(f"ERROR: JSON decoding error in M-Pesa callback: {e}. Raw request data: {request.body}")
        return Response({"message": "Invalid JSON format."}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"CRITICAL ERROR: Unexpected error in M-Pesa callback: {e}")
        return Response({"message": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TherapistAvailabilityListCreateView(generics.ListCreateAPIView):
    serializer_class = TherapistAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_therapist:
            return TherapistAvailability.objects.filter(therapist=self.request.user)
        return TherapistAvailability.objects.none()

    def perform_create(self, serializer):
        if not self.request.user.is_therapist:
            raise PermissionDenied("Only therapists can set availability.")

        day_of_week = self.request.data.get('day_of_week')
        if TherapistAvailability.objects.filter(therapist=self.request.user, day_of_week=day_of_week).exists():
            raise serializers.ValidationError({"detail": f"Availability for {day_of_week} already exists."})

        serializer.save(therapist=self.request.user)

class TherapistAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TherapistAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_therapist:
            return TherapistAvailability.objects.filter(therapist=self.request.user)
        return TherapistAvailability.objects.none()

    def perform_update(self, serializer):
        if not self.request.user.is_therapist:
            raise PermissionDenied("Only therapists can update availability.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_therapist:
            raise PermissionDenied("Only therapists can delete availability.")
        instance.delete()

class TherapistAvailableSlotsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, therapist_id, *args, **kwargs):
        print(f"DEBUG: TherapistAvailableSlotsView - Request received for therapist {therapist_id}")
        try:
            therapist = User.objects.get(id=therapist_id, is_therapist=True, is_verified=True)
            print(f"DEBUG: TherapistAvailableSlotsView - Found therapist: {therapist.email}")
        except User.DoesNotExist:
            print(f"DEBUG: TherapistAvailableSlotsView - Therapist {therapist_id} not found or not verified.")
            return Response({"error": "Therapist not found or not verified."}, status=status.HTTP_404_NOT_FOUND)

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not start_date_str or not end_date_str:
            print("DEBUG: TherapistAvailableSlotsView - Missing start_date or end_date query parameters.")
            return Response({"error": "start_date and end_date query parameters are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            print(f"DEBUG: TherapistAvailableSlotsView - Date range: {start_date} to {end_date}")
        except ValueError:
            print(f"DEBUG: TherapistAvailableSlotsView - Invalid date format. Use '%Y-%m-%d'." )
            return Response({"error": "Invalid date format. Use '%Y-%m-%d'."}, status=status.HTTP_400_BAD_REQUEST)

        if start_date > end_date:
            print("DEBUG: TherapistAvailableSlotsView - start_date is after end_date.")
            return Response({"error": "start_date cannot be after end_date."}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        if start_date < today:
            print(f"DEBUG: TherapistAvailableSlotsView - Adjusted start_date from {start_date} to {today} (current date).")
            start_date = today

        available_slots = defaultdict(list)
        therapist_availabilities = TherapistAvailability.objects.filter(therapist=therapist)
        print(f"DEBUG: TherapistAvailableSlotsView - Number of therapist_availabilities found: {therapist_availabilities.count()}")

        default_availabilities_map = {
            'Monday': {'start_time': time(9, 0), 'end_time': time(17, 0), 'slot_duration': 60, 'break_start_time': None, 'break_end_time': None},
            'Tuesday': {'start_time': time(9, 0), 'end_time': time(17, 0), 'slot_duration': 60, 'break_start_time': None, 'break_end_time': None},
            'Wednesday': {'start_time': time(9, 0), 'end_time': time(17, 0), 'slot_duration': 60, 'break_start_time': None, 'break_end_time': None},
            'Thursday': {'start_time': time(9, 0), 'end_time': time(17, 0), 'slot_duration': 60, 'break_start_time': None, 'break_end_time': None},
            'Friday': {'start_time': time(9, 0), 'end_time': time(17, 0), 'slot_duration': 60, 'break_start_time': None, 'break_end_time': None},
            'Saturday': {'start_time': time(9, 0), 'end_time': time(17, 0), 'slot_duration': 60, 'break_start_time': None, 'break_end_time': None},
            'Sunday': {'start_time': time(9, 0), 'end_time': time(17, 0), 'slot_duration': 60, 'break_start_time': None, 'break_end_time': None},
        }


        scheduled_sessions = Session.objects.filter(
            therapist=therapist,
            session_date__range=[start_date, end_date]
        ).values('session_date', 'session_time', 'duration_minutes')
        print(f"DEBUG: TherapistAvailableSlotsView - Scheduled sessions count: {len(scheduled_sessions)}")

        paid_pending_requests = SessionRequest.objects.filter(
            therapist=therapist,
            status__in=['pending', 'accepted'],
            is_paid=True,
            requested_date__range=[start_date, end_date]
        ).values('requested_date', 'requested_time', 'session_duration')
        print(f"DEBUG: TherapistAvailableSlotsView - Paid pending requests count: {len(paid_pending_requests)}")

        unavailable_intervals = defaultdict(list)
        for session in scheduled_sessions:
            session_date = session['session_date']
            session_start_time = session['session_time']
            session_duration_minutes = session.get('duration_minutes', 120)
            dummy_datetime = timezone.make_aware(datetime.combine(session_date, session_start_time))
            session_end_time = (dummy_datetime + timedelta(minutes=session_duration_minutes)).time()
            unavailable_intervals[session_date].append((session_start_time, session_end_time))
            print(f"DEBUG: Unavailable interval (Scheduled Session): {session_date} {session_start_time}-{session_end_time}")

        for req in paid_pending_requests:
            req_date = req['requested_date']
            req_start_time = req['requested_time']
            req_duration_minutes = req.get('session_duration', 120)
            dummy_datetime = timezone.make_aware(datetime.combine(req_date, req_start_time))
            req_end_time = (dummy_datetime + timedelta(minutes=req_duration_minutes)).time()
            unavailable_intervals[req_date].append((req_start_time, req_end_time))
            print(f"DEBUG: Unavailable interval (Paid Pending Request): {req_date} {req_start_time}-{req_end_time}")


        current_date = start_date
        while current_date <= end_date:
            day_of_week = current_date.strftime('%A')
            availability = therapist_availabilities.filter(day_of_week=day_of_week).first()
            print(f"\n--- Checking {current_date} ({day_of_week}) ---")

            current_day_availability = None
            if availability:
                current_day_availability = availability
                print(f"DEBUG: Found explicit TherapistAvailability for {day_of_week}: {availability.start_time}-{availability.end_time}, break: {availability.break_start_time}-{availability.break_end_time}, slot_duration: {availability.slot_duration}")
            elif day_of_week in default_availabilities_map:
                class TempAvailability:
                    def __init__(self, data):
                        self.start_time = data['start_time']
                        self.end_time = data['end_time']
                        self.slot_duration = data['slot_duration']
                        self.break_start_time = data['break_start_time']
                        self.break_end_time = data['break_end_time']
                current_day_availability = TempAvailability(default_availabilities_map[day_of_week])
                print(f"DEBUG: No explicit availability. Using default for {day_of_week}: {current_day_availability.start_time}-{current_day_availability.end_time}, slot_duration: {current_day_availability.slot_duration}")
            else:
                print(f"DEBUG: No TherapistAvailability found for {day_of_week} on {current_date}, and no default for this day.")
                current_date += timedelta(days=1)
                continue

            working_start = timezone.make_aware(datetime.combine(current_date, current_day_availability.start_time))
            working_end = timezone.make_aware(datetime.combine(current_date, current_day_availability.end_time))

            slot_duration_minutes = current_day_availability.slot_duration if current_day_availability.slot_duration else 60
            print(f"DEBUG: Calculated slot_duration_minutes: {slot_duration_minutes}")

            current_slot_start = working_start
            while current_slot_start + timedelta(minutes=slot_duration_minutes) <= working_end:
                current_slot_end = current_slot_start + timedelta(minutes=slot_duration_minutes)
                print(f"DEBUG: Generating potential slot: {current_slot_start.time()}-{current_slot_end.time()}")

                is_during_break = False
                if current_day_availability.break_start_time and current_day_availability.break_end_time:
                    break_start_dt = timezone.make_aware(datetime.combine(current_date, current_day_availability.break_start_time))
                    break_end_dt = timezone.make_aware(datetime.combine(current_date, current_day_availability.break_end_time))

                    if not (current_slot_end <= break_start_dt or current_slot_start >= break_end_dt):
                        is_during_break = True
                        print(f"DEBUG:   - Slot overlaps with break: {break_start_dt.time()}-{break_end_dt.time()}")

                if not is_during_break:
                    is_booked = False
                    for booked_start_time, booked_end_time in unavailable_intervals[current_date]:
                        booked_start_dt = timezone.make_aware(datetime.combine(current_date, booked_start_time))
                        booked_end_dt = timezone.make_aware(datetime.combine(current_date, booked_end_time))

                        if not (current_slot_end <= booked_start_dt or current_slot_start >= booked_end_dt): # Corrected comparison to current_slot_start
                            is_booked = True
                            print(f"DEBUG:   - Slot conflicts with booked interval: {booked_start_dt.time()}-{booked_end_dt.time()}")
                            break

                    if not is_booked:
                        now = timezone.now()
                        # Removed slot_full_start_datetime as it's not defined here and was causing the error
                        if current_slot_start > now: # Corrected this line to use current_slot_start
                            print(f"DEBUG:   - Adding available slot: {current_slot_start.strftime('%H:%M')}-{current_slot_end.strftime('%H:%M')}")
                            available_slots[current_date.isoformat()].append({
                                "start_time": current_slot_start.strftime('%H:%M'),
                                "end_time": current_slot_end.strftime('%H:%M'),
                                "duration_minutes": slot_duration_minutes
                            })
                        else:
                            print(f"DEBUG:   - Slot {current_slot_start.strftime('%H:%M')}-{current_slot_end.strftime('%H:%M')} is in the past/current moment. (Now: {now})")
                    else:
                        print(f"DEBUG:   - Slot {current_slot_start.strftime('%H:%M')}-{current_slot_end.strftime('%H:%M')} is BOOKED.")
                else:
                    print(f"DEBUG:   - Slot {current_slot_start.strftime('%H:%M')}-{current_slot_end.strftime('%H:%M')} is during BREAK.")

                current_slot_start = current_slot_end

            current_date += timedelta(days=1)

        for date_str in available_slots:
            available_slots[date_str].sort(key=lambda x: datetime.strptime(x['start_time'], '%H:%M').time())

        print(f"DEBUG: Final available_slots to return: {available_slots}")
        return Response(available_slots, status=status.HTTP_200_OK)

# --- NEW: AI Recommendation View (for Meditation Hub) ---
class AiRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if not gemini_model:
            return Response({"error": "AI service is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        journal_entries_data = request.data.get('journal_entries') # Expects a list of entry objects
        if not journal_entries_data:
            return Response({"error": "No journal entries provided for analysis."}, status=status.HTTP_400_BAD_REQUEST)

        # Prepare journal data for the AI prompt
        journal_text = []
        for entry in journal_entries_data:
            journal_text.append(f"Date: {entry.get('date')}, Mood: {entry.get('mood')}, Content: {entry.get('content')}")
        full_journal_context = "\n".join(journal_text)

        # Craft the prompt for Gemini
        prompt_content = f"""
        You are an empathetic and helpful mental wellness AI assistant.
        Analyze the following journal entries provided by a user. Focus on their moods, concerns, and overall emotional state.
        Based on this analysis, recommend ONE specific meditation or mindfulness technique.
        For your recommendation, provide the following in a structured JSON format:
        {{
            "mood_summary": "A brief summary of the user's recent moods and themes.",
            "recommended_technique_title": "The name of the recommended technique (e.g., Mindfulness Breathing, Loving-Kindness Meditation, Body Scan Meditation).",
            "recommended_technique_explanation": "A concise explanation of what the technique involves.",
            "recommended_technique_reason": "A brief explanation of why this technique is beneficial for the user based on their journal entries.",
            "Youtube_query": "A precise search query for a relevant YouTube guided meditation video for this technique (e.g., '10 minute guided mindfulness breathing meditation')."
        }}

        Here are the user's recent journal entries:
        {full_journal_context}

        Please ensure the JSON is valid and contains all specified fields.
        """

        try:
            response = gemini_model.generate_content(prompt_content)
            gemini_response_text = response.text.strip()

            # Attempt to parse Gemini's response as JSON
            try:
                ai_recommendation = json.loads(gemini_response_text)
            except json.JSONDecodeError:
                print(f"ERROR: Gemini response not valid JSON: {gemini_response_text}")
                # If Gemini doesn't return perfect JSON, try to extract text and provide a default
                return Response({
                    "error": "AI could not generate a structured recommendation. Please try again.",
                    "raw_ai_response": gemini_response_text
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # --- Search for YouTube Video ID (NEW) ---
            youtube_video_id = None
            if youtube_service and ai_recommendation.get('Youtube_query'):
                try:
                    search_response = youtube_service.search().list(
                        q=ai_recommendation['Youtube_query'],
                        type='video',
                        part='id,snippet',
                        maxResults=1
                    ).execute()
                    if search_response.get('items'):
                        youtube_video_id = search_response['items'][0]['id']['videoId']
                        print(f"DEBUG: Found YouTube video ID: {youtube_video_id} for query: {ai_recommendation['Youtube_query']}")
                except Exception as e:
                    print(f"ERROR: Youtube failed: {e}")
                    # Continue without video if Youtube fails
            else:
                print("DEBUG: YouTube service not available or no search query provided by AI.")


            final_response = {
                "mood_summary": ai_recommendation.get("mood_summary", "No mood summary provided."),
                "recommended_technique_title": ai_recommendation.get("recommended_technique_title", "Meditation Technique"),
                "recommended_technique_explanation": ai_recommendation.get("recommended_technique_explanation", "No explanation provided."),
                "recommended_technique_reason": ai_recommendation.get("recommended_technique_reason", "No reason provided."),
                "recommended_resource_type": "youtube" if youtube_video_id else "none",
                "recommended_resource_title": ai_recommendation.get("Youtube_query", "Relevant Video") if youtube_video_id else "No specific resource recommended at this time.",
                "recommended_resource_link_or_id": youtube_video_id
            }

            return Response(final_response, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"ERROR: Error calling Gemini API: {e}")
            return Response({"error": "Failed to get AI recommendation. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# --- NEW: AI Chatbot Proxy View ---
class ChatWithGeminiView(APIView):
    permission_classes = [permissions.IsAuthenticated] # Or adjust as needed for public access

    def post(self, request, *args, **kwargs):
        if not gemini_model:
            return Response({"error": "AI service is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        chat_history = request.data.get('chatHistory', [])
        current_message_text = request.data.get('currentMessage')

        if not current_message_text:
            return Response({"error": "No message provided for chat."}, status=status.HTTP_400_BAD_REQUEST)

        # Initialize the AI's persona and STRICT limitations for each new chat session.
        # This prompt is designed to be highly restrictive for external knowledge.
        system_instruction = {
            "role": "user", # This will be the first "user" turn setting the context
            "parts": [{ "text": """
                You are MindWell's AI assistant. Your sole purpose is to provide information **ONLY** about:
                1.  **The MindWell platform itself:** Its features (Smart Digital Journaling, Professional Therapist Connections, AI-Powered Support, Self-Care & Meditation Library, Engaging Challenges & Rewards), how to use them, and general information about the platform's mission in Kenya.
                2.  **General mental wellness topics related to journaling and meditation:** Concepts, benefits, basic techniques for self-care.

                **CRITICAL RESTRICTIONS - Adhere to these ABSOLUTELY:**
                * **NO EXTERNAL KNOWLEDGE:** You MUST NOT access or provide information from outside the scope explicitly defined above. This means you **CANNOT** search the web, answer questions about famous people (like musicians, actors, politicians), current events, geography, science, history, or any topic not directly about MindWell or general self-care mental wellness concepts.
                * **NO MEDICAL OR THERAPEUTIC ADVICE:** You MUST NOT provide diagnoses, medical advice, or specific therapeutic interventions. Always advise consulting a qualified professional for personalized help.
                * **REFUSAL PROTOCOL:** If a user asks a question that falls outside your defined scope, you MUST gracefully refuse to answer. Use a concise refusal, such as:
                    * "My apologies, but I am limited to providing information about the MindWell platform and general mental wellness topics. I cannot answer questions outside of this scope."
                    * "I cannot provide information on that topic as it falls outside my designated area of expertise, which is MindWell and mental well-being."
                * **PRIORITIZE REFUSAL:** Do NOT attempt to infer, guess, or vaguely relate an out-of-scope query to your domain. Direct refusal as per the protocol is required.

                Be empathetic and supportive within your strict boundaries. Your performance depends on adhering to these rules.
                """
            }]
        }

        # Prepare chat history for Gemini, including the system instruction
        formatted_history = [system_instruction]
        for msg in chat_history:
            # Only include actual user/model messages, not previous system instructions if any
            # We explicitly prevent the AI from seeing its own previous disclaimer, as it's added on the frontend.
            # Only include actual dialogue turns.
            if msg.get('type') == 'user':
                formatted_history.append({'role': 'user', 'parts': [{'text': msg['text']}]})
            elif msg.get('type') == 'bot':
                # Filter out the static disclaimer added by the frontend from AI's memory
                clean_text = msg['text'].split("\n\n*Please remember I am an AI assistant")[0].strip()
                if clean_text: # Only add if there's actual content left
                    formatted_history.append({'role': 'model', 'parts': [{'text': clean_text}]})
        
        # Add the current user message
        formatted_history.append({'role': 'user', 'parts': [{'text': current_message_text}]})


        try:
            # Set generation config for the chat
            generation_config = {
                "temperature": 0.7,
                "max_output_tokens": 200,
            }
            # Make the API call
            response = gemini_model.generate_content(formatted_history, generation_config=generation_config)
            bot_response_text = response.text.strip()

            # Add a consistent disclaimer on the backend regardless of AI's output content
            # This ensures it's always present and we can enforce it.
            bot_response_text += "\n\n*Please remember I am an AI assistant and not a substitute for professional medical advice or therapy. If you are in crisis, please seek immediate professional help.*"

            return Response({"bot_response": bot_response_text}, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"ERROR: Error calling Gemini API for chat: {e}")
            return Response({"error": "Failed to get response from AI chat. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# ... (rest of the file, including ChatMessageListView) ...
        
class ChatMessageListView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _parse_room_name(self, room_name):
        # The room_name is expected to be like 'chat_ID1_ID2' from frontend
        parts = room_name.split('_')
        if len(parts) == 3 and parts[0] == 'chat':
            user1_id = int(parts[1])
            user2_id = int(parts[2])
            return user1_id, user2_id
        else:
            raise ValueError("Invalid room name format. Expected 'chat_ID1_ID2'.")

    def get_queryset(self):
        room_name = self.kwargs['room_name']

        # Ensure correct authorization for the chat room
        sender_id, receiver_id = self._parse_room_name(room_name)
        if self.request.user.id not in [sender_id, receiver_id]:
            raise PermissionDenied("You are not authorized to view this chat.")

        # <--- CORRECTED: Filter by the 'name' field of the related 'chat_room'
        return ChatMessage.objects.filter(chat_room__name=room_name).order_by('timestamp')
    
class TherapistChatRoomListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        if not user.is_therapist:
            return Response({"detail": "Access denied. Only therapists can view chat rooms."}, status=status.HTTP_403_FORBIDDEN)

        # Get chat rooms where the current therapist is either user1 or user2
        chat_rooms = ChatRoom.objects.filter(Q(user1=user) | Q(user2=user)).distinct()
        
        serializer = ChatRoomSerializer(chat_rooms, many=True)
        return Response(serializer.data)
    
class GetChatPartnerDetailView(APIView):
    """
    Given a room_name (e.g., chat_1_2), returns the details
    of the *other* user in the chat room.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, room_name, *args, **kwargs):
        try:
            # Parse room_name, e.g., "chat_1_2"
            parts = room_name.split('_')
            if len(parts) != 3 or parts[0] != 'chat':
                raise ValueError("Invalid room name format")

            user1_id = int(parts[1])
            user2_id = int(parts[2])

            current_user_id = request.user.id
            partner_id = None

            if current_user_id == user1_id:
                partner_id = user2_id
            elif current_user_id == user2_id:
                partner_id = user1_id
            else:
                # If the requesting user is not part of this room
                raise PermissionDenied("You are not authorized to view this chat.")

            partner = User.objects.get(id=partner_id)

            # We use a simple serializer to send only what's needed
            serializer = UserChatDetailSerializer(partner)
            return Response(serializer.data)

        except (ValueError, User.DoesNotExist):
            return Response({"error": "Invalid room or user not found."}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
