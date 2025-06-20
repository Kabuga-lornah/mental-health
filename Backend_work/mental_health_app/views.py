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

from .models import JournalEntry, SessionRequest, TherapistApplication, User, Session, Payment
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

User = get_user_model()

from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, TherapistSerializer,
    JournalEntrySerializer, JournalListSerializer, SessionRequestSerializer,
    SessionRequestUpdateSerializer, SessionSerializer, TherapistApplicationSerializer,
    TherapistApplicationAdminSerializer, PaymentSerializer
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

    def perform_create(self, serializer):
        therapist_id = self.request.data.get('therapist')
        try:
            therapist = User.objects.get(id=therapist_id, is_therapist=True, is_verified=True)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"therapist": "Invalid therapist ID, user is not a verified therapist, or does not exist."}
            )

        if self.request.user == therapist:
            raise serializers.ValidationError(
                {"therapist": "You cannot request a session with yourself."}
            )

        existing_request = SessionRequest.objects.filter(
            client=self.request.user,
            status__in=['pending', 'accepted']
        ).exists()

        existing_session = Session.objects.filter(
            client=self.request.user,
            status='scheduled'
        ).exists()

        if existing_request or existing_session:
            raise serializers.ValidationError(
                {"detail": "You already have a pending request or an active scheduled session. Please complete it before requesting a new one."}
            )

        if not therapist.is_free_consultation and therapist.hourly_rate and therapist.hourly_rate > 0:
            payment = Payment.objects.filter(
                client=self.request.user,
                therapist=therapist,
                status='completed',
                session_request__isnull=True
            ).first()

            if not payment:
                raise serializers.ValidationError(
                    {"detail": "Payment required before requesting a session with this therapist."}
                )

        session_request_instance = serializer.save(client=self.request.user, therapist=therapist)

        if not therapist.is_free_consultation and therapist.hourly_rate and therapist.hourly_rate > 0:
            payment = Payment.objects.filter(
                client=self.request.user,
                therapist=therapist,
                status='completed',
                session_request__isnull=True
            ).first()
            if payment:
                payment.session_request = session_request_instance
                payment.status = 'used'
                payment.save()

class TherapistSessionCreateView(generics.CreateAPIView):
    serializer_class = SessionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if not (self.request.user.is_therapist and self.request.user.is_verified):
            raise serializers.ValidationError(
                {"detail": "Only verified therapists can create sessions."}
            )

        client_id = self.request.data.get('client')
        try:
            client = User.objects.get(id=client_id)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"client": "Invalid client ID or client does not exist."}
            )

        if self.request.user == client:
            raise serializers.ValidationError(
                {"client": "You cannot create a session with yourself."}
            )

        serializer.save(
            client=client,
            therapist=self.request.user,
            status='accepted'
        )

class TherapistSessionRequestListView(generics.ListAPIView):
    serializer_class = SessionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_therapist or not self.request.user.is_verified:
            return SessionRequest.objects.none()

        status_filter = self.request.query_params.get('status')
        queryset = SessionRequest.objects.filter(therapist=self.request.user)

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

class SessionCreateFromRequestView(generics.CreateAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        request_id = request.data.get('session_request')
        session_request = get_object_or_404(SessionRequest, id=request_id)

        if request.user != session_request.therapist:
            return Response({'error': 'You are not authorized to accept this request.'}, status=status.HTTP_403_FORBIDDEN)

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
            'session_type': request.data.get('session_type', 'online'),
            'location': request.data.get('location', None),
            'zoom_meeting_url': request.data.get('zoom_meeting_url', None)
        }

        serializer = self.get_serializer(data=session_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

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
        therapist_id = request.data.get('therapist')
        amount = request.data.get('amount')
        mpesa_phone_number = request.data.get('mpesa_phone_number')

        if not therapist_id or not amount or not mpesa_phone_number:
            return Response({"error": "Therapist ID, amount, and M-Pesa phone number are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            therapist = User.objects.get(id=therapist_id, is_therapist=True, is_verified=True)
        except User.DoesNotExist:
            return Response({"error": "Therapist not found or not verified."}, status=status.HTTP_404_NOT_FOUND)

        # Validate phone number format
        if not mpesa_phone_number.startswith('254') or not mpesa_phone_number[3:].isdigit() or len(mpesa_phone_number) != 12:
            return Response({"error": "Invalid M-Pesa phone number format. Must start with '254' and be 12 digits long (e.g., 254712345678)."}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure amount is an integer or can be converted to one for M-Pesa
        try:
            amount_int = int(float(amount))
            if amount_int <= 0:
                raise ValueError("Amount must be a positive number.")
        except (ValueError, TypeError):
            return Response({"error": "Invalid amount. Must be a positive number."}, status=status.HTTP_400_BAD_REQUEST)

        # Initiate STK Push
        callback_url = f"{settings.MPESA_STK_CALLBACK_URL}"
        account_reference = f"TherapySession_{self.request.user.id}_{therapist.id}_{timezone.now().timestamp()}"
        transaction_desc = f"Payment for session with {therapist.first_name} {therapist.last_name}"

        stk_response = initiate_stk_push(
            phone_number=mpesa_phone_number,
            amount=amount_int,
            account_reference=account_reference,
            transaction_desc=transaction_desc,
            callback_url=callback_url
        )

        if stk_response["success"]:
            #pending Payment record in your database
            payment_data = {
                'client': self.request.user.id,
                'therapist': therapist.id,
                'amount': amount_int,
                'status': 'pending',
                'transaction_id': stk_response.get('merchant_request_id'),
                'checkout_request_id': stk_response.get('checkout_request_id'),
            }
            serializer = self.get_serializer(data=payment_data)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response({
                "message": "M-Pesa STK Push initiated. Please check your phone to complete the payment.",
                "checkout_request_id": stk_response.get('checkout_request_id')
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": stk_response["message"]}, status=status.HTTP_400_BAD_REQUEST)

class ClientPaymentStatusView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        therapist_id = self.kwargs.get('therapist_id')
        if not therapist_id:
            return Response({"error": "Therapist ID is required."}, status=status.HTTP_400_BAD_REQUEST)

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

        try:
            payment = Payment.objects.get(checkout_request_id=checkout_request_id)
        except Payment.DoesNotExist:
            print(f"Payment not found for CheckoutRequestID: {checkout_request_id}")
            return Response({"message": "Payment record not found."}, status=status.HTTP_404_NOT_FOUND)

        if result_code == 0:
            payment.status = 'completed'
            payment.mpesa_receipt_number = mpesa_receipt_number
            payment.transaction_id = mpesa_receipt_number
            payment.save()
            print(f"Payment for {checkout_request_id} updated to 'completed'.")
            return Response({"message": "Payment successful and updated."}, status=status.HTTP_200_OK)
        else:
            payment.status = 'failed'
            payment.reviewer_notes = result_desc
            payment.save()
            print(f"Payment for {checkout_request_id} updated to 'failed'. Reason: {result_desc}")
            return Response({"message": "Payment failed or cancelled."}, status=status.HTTP_200_OK)

    except json.JSONDecodeError as e:
        print(f"JSON decoding error in M-Pesa callback: {e}")
        return Response({"message": "Invalid JSON format."}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Unexpected error in M-Pesa callback: {e}")
        return Response({"message": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)