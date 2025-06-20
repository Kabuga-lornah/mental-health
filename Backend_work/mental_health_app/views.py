from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied
from .models import JournalEntry, SessionRequest, TherapistApplication, User, Session, Payment
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
import json

User = get_user_model()

# Serializers
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    is_verified = serializers.BooleanField(read_only=True)
    bio = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    specializations = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    is_available = serializers.BooleanField(required=False, default=False)
    hourly_rate = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    license_credentials = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    approach_modalities = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    languages_spoken = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    client_focus = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    insurance_accepted = serializers.BooleanField(required=False, default=False)
    video_introduction_url = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    is_free_consultation = serializers.BooleanField(required=False, default=False)
    session_modes = serializers.ChoiceField(choices=User.SESSION_MODES_CHOICES, required=False, allow_null=True)
    physical_address = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone', 'is_therapist',
            'is_verified', 'bio', 'years_of_experience', 'specializations',
            'is_available', 'hourly_rate', 'profile_picture',
            'license_credentials', 'approach_modalities', 'languages_spoken',
            'client_focus', 'insurance_accepted', 'video_introduction_url',
            'is_free_consultation', 'session_modes', 'physical_address'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'id': {'read_only': True},
        }

    def validate(self, attrs):
        if attrs.get('password') and attrs.get('password2') and attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        email = attrs.get('email')
        if self.instance is None and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "This email is already in use."})
            
        if attrs.get('is_therapist'):
            if attrs.get('is_available') is None:
                raise serializers.ValidationError(
                    {"is_available": "Therapists must specify availability."}
                )
            if not attrs.get('is_free_consultation') and (attrs.get('hourly_rate') is not None and not isinstance(attrs['hourly_rate'], (int, float))):
                raise serializers.ValidationError(
                    {"hourly_rate": "Hourly rate must be a number."}
                )
            if attrs.get('session_modes') in ['physical', 'both'] and not attrs.get('physical_address'):
                raise serializers.ValidationError(
                    {"physical_address": "Physical address is required for in-person sessions."}
                )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2', None)
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        try:
            user = User.objects.create_user(email=email, password=password, **validated_data)
            return user
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        validated_data.pop('password2', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance

class RegisterSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        pass

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        if email and password:
            user = User.objects.filter(email=email).first()
            if user and user.check_password(password):
                attrs['user'] = user
                return attrs
            raise serializers.ValidationError("Unable to log in with provided credentials.")
        raise serializers.ValidationError("Must include 'email' and 'password'.")

class TherapistSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField() 

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 
            'is_available', 'hourly_rate', 'profile_picture',
            'bio', 'years_of_experience', 'specializations',
            'license_credentials', 'approach_modalities', 'languages_spoken',
            'client_focus', 'insurance_accepted', 'video_introduction_url',
            'is_free_consultation', 'session_modes', 'physical_address'
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None 

class JournalEntrySerializer(serializers.ModelSerializer):
    attachment_file = serializers.FileField(
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = JournalEntry
        fields = [
            'id', 'date', 'mood', 'entry', 'tags',
            'attachment_name', 'attachment_file', 'user'
        ]
        read_only_fields = ['id', 'date', 'user']

    def create(self, validated_data):
        attachment_file = validated_data.pop('attachment_file', None)
        if attachment_file:
            validated_data['attachment_name'] = attachment_file.name
        return super().create(validated_data)

    def to_internal_value(self, data):
        tags = data.get('tags')
        if tags and isinstance(tags, str):
            try:
                mutable_data = data.copy()
                mutable_data['tags'] = json.loads(tags)
                return super().to_internal_value(mutable_data)
            except json.JSONDecodeError:
                raise serializers.ValidationError({
                    'tags': 'Invalid JSON format for tags.'
                })
        return super().to_internal_value(data)

class JournalListSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = ['id', 'date', 'mood', 'tags', 'attachment_name']
        read_only_fields = fields

class SessionRequestSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    therapist_name = serializers.CharField(source='therapist.get_full_name', read_only=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)
    session_duration = serializers.IntegerField(min_value=30, max_value=240, default=60)
    client = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = SessionRequest
        fields = [
            'id', 'client', 'therapist', 'status', 'requested_date',
            'requested_time', 'message', 'created_at', 'updated_at',
            'client_name', 'therapist_name', 'client_email',
            'session_duration', 'session_notes', 'is_paid'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'client_name', 
            'therapist_name', 'client_email'
        ]

    def validate(self, attrs):
        if attrs.get('therapist') and not attrs['therapist'].is_therapist:
            raise serializers.ValidationError(
                {"therapist": "Selected user is not a therapist."}
            )
        return attrs

    def create(self, validated_data):
        return SessionRequest.objects.create(**validated_data)

class SessionRequestUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionRequest
        fields = ['id', 'status', 'session_notes', 'is_paid', 'requested_date', 'requested_time', 'message']  
        read_only_fields = ['id']

    def validate_status(self, value):
        valid_transitions = {
            'pending': ['accepted', 'rejected', 'cancelled'],
            'accepted': ['completed', 'cancelled'],
            'rejected': [],
            'completed': [],
            'cancelled': []
        }
        current_status = self.instance.status
        if value not in valid_transitions.get(current_status, []):
            raise serializers.ValidationError(
                f"Cannot transition from {current_status} to {value}"
            )
        return value

class SessionSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)
    therapist_name = serializers.CharField(source='therapist.get_full_name', read_only=True)

    class Meta:
        model = Session
        fields = [
            'id', 'session_request', 'client', 'therapist', 'client_name', 'client_email',
            'therapist_name', 'session_date', 'session_time', 'session_type', 'location',
            'status', 'notes', 'key_takeaways', 'recommendations', 'follow_up_required',
            'next_session_date', 'created_at', 'updated_at', 'zoom_meeting_url'
        ]
        read_only_fields = ['client_name', 'client_email', 'therapist_name', 'created_at', 'updated_at']

class TherapistApplicationSerializer(serializers.ModelSerializer):
    applicant_email = serializers.ReadOnlyField(source='applicant.email')
    applicant_full_name = serializers.SerializerMethodField()

    class Meta:
        model = TherapistApplication
        fields = [
            'id', 'applicant', 'applicant_email', 'applicant_full_name',
            'license_number', 'license_document', 'id_number', 'id_document',
            'professional_photo', 'motivation_statement', 'status', 'submitted_at',
            'reviewed_at', 'reviewer_notes', 'specializations',
            'license_credentials', 'approach_modalities', 'languages_spoken',
            'client_focus', 'insurance_accepted',
            'years_of_experience', 'is_free_consultation', 'session_modes', 'physical_address',
            'hourly_rate'
        ]
        read_only_fields = [
            'id', 'applicant', 'status', 'submitted_at',
            'reviewed_at', 'reviewer_notes', 'applicant_email', 'applicant_full_name'
        ]
        extra_kwargs = {
            'license_document': {'required': True},
            'id_document': {'required': True},
            'professional_photo': {'required': True},
            'license_number': {'required': True},
            'id_number': {'required': True},
            'motivation_statement': {'required': True},
            'specializations': {'required': True}, 
            'years_of_experience': {'required': True}, 
            'license_credentials': {'required': True},
            'approach_modalities': {'required': True},
            'languages_spoken': {'required': True},
            'client_focus': {'required': True},
        }
    
    def validate(self, attrs):
        session_modes = attrs.get('session_modes')
        physical_address = attrs.get('physical_address')
        if session_modes in ['physical', 'both'] and not physical_address:
            raise serializers.ValidationError({"physical_address": "Physical address is required if offering in-person sessions."})
        return attrs

    def get_applicant_full_name(self, obj):
        return obj.applicant.get_full_name()

class TherapistApplicationAdminSerializer(serializers.ModelSerializer):
    applicant_email = serializers.EmailField(source='applicant.email', read_only=True)
    applicant_full_name = serializers.CharField(source='applicant.get_full_name', read_only=True)

    class Meta:
        model = TherapistApplication
        fields = [
            'id', 'applicant', 'applicant_email', 'applicant_full_name',
            'license_number', 'license_document', 'id_number', 'id_document',
            'professional_photo', 'motivation_statement', 'status', 'submitted_at',
            'reviewed_at', 'reviewer_notes', 'specializations',
            'license_credentials', 'approach_modalities', 'languages_spoken',
            'client_focus', 'insurance_accepted',
            'years_of_experience', 'is_free_consultation', 'session_modes', 'physical_address',
            'hourly_rate'
        ]
        read_only_fields = [
            'id', 'applicant', 'submitted_at', 'applicant_email', 
            'applicant_full_name', 'license_number', 'license_document', 
            'id_number', 'id_document', 'professional_photo', 
            'motivation_statement', 'specializations',
            'license_credentials', 'approach_modalities', 'languages_spoken',
            'client_focus', 'insurance_accepted',
            'years_of_experience', 'is_free_consultation', 'session_modes', 'physical_address'
        ]

    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        instance.reviewer_notes = validated_data.get('reviewer_notes', instance.reviewer_notes)
        instance.reviewed_at = timezone.now()
        
        applicant = instance.applicant
        
        if instance.status == 'approved':
            applicant.is_verified = True
            applicant.is_available = True
            if not applicant.bio: 
                applicant.bio = instance.motivation_statement
            
            applicant.specializations = instance.specializations
            applicant.license_credentials = instance.license_credentials
            applicant.approach_modalities = instance.approach_modalities
            applicant.languages_spoken = instance.languages_spoken
            applicant.client_focus = instance.client_focus
            applicant.insurance_accepted = instance.insurance_accepted
            applicant.years_of_experience = instance.years_of_experience
            applicant.is_free_consultation = instance.is_free_consultation 
            applicant.session_modes = instance.session_modes 
            applicant.physical_address = instance.physical_address 

            applicant.save()
        else: 
            if applicant.is_verified:
                applicant.is_verified = False
                applicant.is_available = False
                applicant.save()
                
        instance.save()
        return instance

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'client', 'therapist', 'amount', 'payment_date', 'status', 'transaction_id', 'session_request']
        read_only_fields = ['id', 'client', 'payment_date', 'status', 'transaction_id', 'session_request']

# Views
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

        if not therapist_id or not amount:
            return Response({"error": "Therapist ID and amount are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            therapist = User.objects.get(id=therapist_id, is_therapist=True, is_verified=True)
        except User.DoesNotExist:
            return Response({"error": "Therapist not found or not verified."}, status=status.HTTP_404_NOT_FOUND)

        payment_data = {
            'client': request.user.id,
            'therapist': therapist.id,
            'amount': amount,
            'status': 'completed',
            'transaction_id': f"Mpesa-{timezone.now().timestamp()}"
        }

        serializer = self.get_serializer(data=payment_data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({"message": "Payment simulated successfully! You can now request a session.", "payment_status": "completed"}, status=status.HTTP_201_CREATED)

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