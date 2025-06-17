from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied
from .models import JournalEntry, SessionRequest, TherapistApplication, User, Session

from .serializers import (
    UserSerializer, LoginSerializer, JournalEntrySerializer, JournalListSerializer,
    TherapistSerializer, SessionRequestSerializer, SessionRequestUpdateSerializer,
    TherapistApplicationSerializer, TherapistApplicationAdminSerializer,
    SessionSerializer, RegisterSerializer
)

User = get_user_model()

# Custom permission for admin access
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
                    # NEW fields added to user data in response
                    'license_credentials': user.license_credentials,
                    'approach_modalities': user.approach_modalities,
                    'languages_spoken': user.languages_spoken,
                    'client_focus': user.client_focus,
                    'insurance_accepted': user.insurance_accepted,
                    'video_introduction_url': user.video_introduction_url
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
                    # NEW fields added to user data in response
                    'license_credentials': user.license_credentials,
                    'approach_modalities': user.approach_modalities,
                    'languages_spoken': user.languages_spoken,
                    'client_focus': user.client_focus,
                    'insurance_accepted': user.insurance_accepted,
                    'video_introduction_url': user.video_introduction_url
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

        # Ensure applicant's is_therapist status is set to True upon application submission
        user = self.request.user
        if not user.is_therapist:
            user.is_therapist = True
            user.save()

        # Save the application, including the new fields
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
        serializer.save()

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
        
        # Add request context to serializer for profile_picture absolute URL
        return queryset.order_by('last_name', 'first_name')
    
    def get_serializer_context(self):
        return {'request': self.request}

# NEW: Therapist Detail View
class TherapistDetailView(generics.RetrieveAPIView):
    serializer_class = TherapistSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.filter(is_therapist=True, is_verified=True) # Only show verified therapists

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

        serializer.save(client=self.request.user, therapist=therapist)

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

# Session Views
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
            'location': request.data.get('location', None)
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

# NEW: Client Session List View
class ClientSessionListView(generics.ListAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return sessions where the current user is the client
        queryset = Session.objects.filter(client=self.request.user)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        return queryset.order_by('-session_date', '-session_time')
