# File: Backend_work/mental_health_app/views.py

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
import time as raw_time # Corrected import for time.sleep
from django.db import transaction


from .models import JournalEntry, SessionRequest, TherapistApplication, User, Session, Payment, TherapistAvailability
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

User = get_user_model()

from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, TherapistSerializer,
    JournalEntrySerializer, JournalListSerializer, SessionRequestSerializer,
    SessionRequestUpdateSerializer, SessionSerializer, TherapistApplicationSerializer,
    TherapistApplicationAdminSerializer, PaymentSerializer,
    TherapistAvailabilitySerializer
)

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
        return token
    except requests.exceptions.RequestException as e:
        print(f"Error generating M-Pesa access token: {e}")
        return None

def initiate_stk_push(phone_number, amount, account_reference, transaction_desc, callback_url):
    access_token = generate_mpesa_access_token()
    if not access_token:
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

    try:
        response = requests.post(f"{settings.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest", json=payload, headers=headers, timeout=20)
        response.raise_for_status()
        response_data = response.json()
        print(f"STK Push response: {response_data}")

        if response_data.get('ResponseCode') == '0':
            return {
                "success": True,
                "message": "STK Push initiated successfully.",
                "checkout_request_id": response_data.get('CheckoutRequestID'),
                "merchant_request_id": response_data.get('MerchantRequestID')
            }
        else:
            return {
                "success": False,
                "message": response_data.get('ResponseDescription', 'STK Push initiation failed.'),
                "error_code": response_data.get('ResponseCode'),
                "error_message": response_data.get('CustomerMessage')
            }
    except requests.exceptions.RequestException as e:
        print(f"Error initiating STK Push: {e}")
        return {"success": False, "message": f"Network or API error: {e}"}

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_staff and request.user.is_superuser

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
                    'profile_picture': request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None,
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
                    'profile_picture': request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None,
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
        ).values('session_date', 'session_time', 'duration_minutes') # Corrected: Added 'session_date'

        paid_pending_requests_on_date = SessionRequest.objects.filter(
            therapist=therapist,
            status__in=['pending', 'accepted'],
            is_paid=True,
            requested_date=requested_date
        ).values('requested_date', 'requested_time', 'session_duration') # Corrected: Added 'requested_date'


        for session in scheduled_sessions_on_date:
            booked_start_time = session['session_time']
            booked_duration = session.get('duration_minutes', 120)
            booked_start_dt = timezone.make_aware(datetime.combine(session['session_date'], booked_start_time)) # Access 'session_date' here
            booked_end_dt = booked_start_dt + timedelta(minutes=booked_duration)

            if not (slot_end_dt <= booked_start_dt or slot_start_dt >= booked_end_dt):
                print(f"DEBUG: Slot check - Slot {slot_start_dt.time()}-{slot_end_dt.time()} conflicts with scheduled session {booked_start_dt.time()}-{booked_end_dt.time()}")
                return False, "Requested slot is already booked."

        for req in paid_pending_requests_on_date:
            booked_start_time = req['requested_time']
            booked_duration = req.get('session_duration', 120)
            booked_start_dt = timezone.make_aware(datetime.combine(req['requested_date'], booked_start_time)) # Access 'requested_date' here
            booked_end_dt = booked_start_dt + timedelta(minutes=booked_duration)

            if not (slot_end_dt <= booked_start_dt or slot_start_dt >= booked_end_dt):
                print(f"DEBUG: Slot check - Slot {slot_start_dt.time()}-{slot_end_dt.time()} conflicts with paid pending request {booked_start_dt.time()}-{booked_end_dt.time()}")
                return False, "Requested slot is currently pending payment confirmation for another user."


        if slot_start_dt <= timezone.now():
            print(f"DEBUG: Slot check - Slot {slot_start_dt} is in the past compared to {timezone.now()}")
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
        session_request_instance = serializer.save(client=self.request.user, therapist=therapist, is_paid=False, status='pending')

        return Response({
            "message": "Session request created successfully. Proceed to payment to confirm your booking.",
            "session_request_id": session_request_instance.id,
            "therapist_hourly_rate": therapist.hourly_rate if not therapist.is_free_consultation else 0,
            "is_free_consultation": therapist.is_free_consultation
        }, status=status.HTTP_201_CREATED)


class TherapistSessionCreateView(generics.CreateAPIView):
    serializer_class = SessionSerializer # <--- MODIFIED: Changed to SessionSerializer
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

        session_request.status = 'accepted'
        session_request.save()

        session_data = {
            'session_request': session_request.id,
            'client': session_request.client.id,
            'therapist': session_request.therapist.id,
            'session_date': session_request.requested_date,
            'session_time': session_request.requested_time,
            'duration_minutes': session_request.session_duration,
            'session_type': request.data.get('session_type', 'online'),
            'location': request.data.get('location', None),
            'zoom_meeting_url': request.data.get('zoom_meeting_url', None)
        }

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
        queryset = SessionRequest.objects.filter(therapist=self.request.user, is_paid=True)

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-created_at')

class ClientSessionRequestListView(generics.ListAPIView):
    serializer_class = SessionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        status_filter = self.request.query_params.get('status')
        queryset = SessionRequest.objects.filter(client=self.request.user)

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
        return Session.objects.filter(therapist=self.request.user).order_by('-session_date', '-session_time')

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

        if 'status' in request.data and request.data['status'] == 'completed':
            if instance.status != 'completed':
                if not all(field in request.data for field in ['notes', 'key_takeaways', 'recommendations']):
                    pass

        self.perform_update(serializer)

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
            payment_data = {
                'client': self.request.user.id,
                'therapist': therapist.id,
                'amount': amount_int,
                'status': 'pending',
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
    print(f"Request data: {request.data}")

    try:
        body = request.data.get('Body')
        stk_callback = body.get('stkCallback')

        if not stk_callback:
            print("Invalid M-Pesa callback format: missing stkCallback.")
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

        print(f"Callback Details: MerchantRequestID={merchant_request_id}, CheckoutRequestID={checkout_request_id}, ResultCode={result_code}, MpesaReceiptNumber={mpesa_receipt_number}")

        payment = None
        max_retries = 5
        retry_delay_seconds = 1

        for i in range(max_retries):
            try:
                payment = Payment.objects.get(checkout_request_id=checkout_request_id)
                print(f"DEBUG: Found Payment record for CheckoutRequestID: {checkout_request_id} on attempt {i+1}.")
                break
            except Payment.DoesNotExist:
                print(f"DEBUG: Payment not found for CheckoutRequestID: {checkout_request_id}. Retrying in {retry_delay_seconds} second(s)... (Attempt {i+1}/{max_retries})")
                raw_time.sleep(retry_delay_seconds)
        
        if not payment:
            print(f"ERROR: Payment record still not found after {max_retries} attempts for CheckoutRequestID: {checkout_request_id}")
            return Response({"message": "Payment record not found after multiple attempts."}, status=status.HTTP_404_NOT_FOUND)

        if result_code == 0:
            payment.status = 'completed'
            payment.mpesa_receipt_number = mpesa_receipt_number
            payment.transaction_id = mpesa_receipt_number
            payment.save()
            print(f"Payment for {checkout_request_id} updated to 'completed'.")

            if payment.session_request:
                payment.session_request.is_paid = True
                payment.session_request.save()
                print(f"SessionRequest {payment.session_request.id} marked as paid.")

            return Response({"message": "Payment successful and updated."}, status=status.HTTP_200_OK)
        else:
            payment.status = 'failed'
            payment.reviewer_notes = result_desc 
            payment.save()
            print(f"Payment for {checkout_request_id} updated to 'failed'. Reason: {result_desc}")

            if payment.session_request:
                payment.session_request.status = 'cancelled'
                payment.session_request.save()
                print(f"SessionRequest {payment.session_request.id} cancelled due to payment failure.")

            return Response({"message": "Payment failed or cancelled."}, status=status.HTTP_200_OK)

    except json.JSONDecodeError as e:
        print(f"JSON decoding error in M-Pesa callback: {e}")
        return Response({"message": "Invalid JSON format."}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Unexpected error in M-Pesa callback: {e}")
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
            print(f"DEBUG: TherapistAvailableSlotsView - Invalid date format: start={start_date_str}, end={end_date_str}")
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
        ).values('session_date', 'session_time', 'duration_minutes') # Corrected: Added 'session_date'
        print(f"DEBUG: TherapistAvailableSlotsView - Scheduled sessions count: {len(scheduled_sessions)}")

        paid_pending_requests = SessionRequest.objects.filter(
            therapist=therapist,
            status__in=['pending', 'accepted'],
            is_paid=True,
            requested_date__range=[start_date, end_date]
        ).values('requested_date', 'requested_time', 'session_duration') # Corrected: Added 'requested_date'
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

                        if not (current_slot_end <= booked_start_dt or current_slot_start >= booked_end_dt):
                            is_booked = True
                            print(f"DEBUG:   - Slot conflicts with booked interval: {booked_start_dt.time()}-{booked_end_dt.time()}")
                            break

                    if not is_booked:
                        now = timezone.now()
                        slot_full_start_datetime = timezone.make_aware(datetime.combine(current_date, current_slot_start.time()))

                        if slot_full_start_datetime > now:
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