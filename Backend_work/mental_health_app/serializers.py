# mental_health_app/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import JournalEntry, TherapistApplication, SessionRequest
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
import json

User = get_user_model()

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

    class Meta:
        model = User
        fields = [
            'id', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone', 'is_therapist',
            'is_verified', 'bio', 'years_of_experience', 'specializations',
            'is_available', 'hourly_rate', 'profile_picture'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'id': {'read_only': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        email = attrs.get('email')
        if self.instance is None and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "This email is already in use."})
        if attrs.get('is_therapist'):
            if attrs.get('is_available') is None:
                raise serializers.ValidationError(
                    {"is_available": "Therapists must specify availability."}
                )
            if attrs.get('hourly_rate') is not None and not isinstance(attrs['hourly_rate'], (int, float)):
                raise serializers.ValidationError(
                    {"hourly_rate": "Hourly rate must be a number."}
                )
        return attrs

    # =========================================================================
    # === CORRECTED CODE BLOCK STARTS HERE ===
    # =========================================================================
    def create(self, validated_data):
        """
        Creates and returns a new User instance, given the validated data.
        """
        # Remove password2 as it's only used for confirmation
        validated_data.pop('password2', None)
        
        # The CustomUserManager's `create_user` method expects 'email' and 'password' 
        # as separate arguments. We pop them from the validated data.
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        # The rest of the dictionary now contains only the 'extra_fields'.
        try:
            # Create the user by passing the main arguments and the extra fields.
            user = User.objects.create_user(email=email, password=password, **validated_data)
            return user
        except DjangoValidationError as e:
            # Catch potential validation errors from the model and raise them
            # as a serializer validation error.
            raise serializers.ValidationError(e.message_dict)
    # =========================================================================
    # === CORRECTED CODE BLOCK ENDS HERE ===
    # =========================================================================

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        validated_data.pop('password2', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

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

class TherapistSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'email', 'phone',
            'is_available', 'hourly_rate', 'profile_picture',
            'bio', 'years_of_experience', 'specializations'
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class SessionRequestSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(
        source='client.get_full_name',
        read_only=True
    )
    therapist_name = serializers.CharField(
        source='therapist.get_full_name',
        read_only=True
    )
    client_email = serializers.EmailField(
        source='client.email',
        read_only=True
    )
    session_duration = serializers.IntegerField(
        min_value=30,
        max_value=240,
        default=60
    )
    
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
        fields = ['id', 'status', 'session_notes', 'is_paid']
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
        if value not in valid_transitions[current_status]:
            raise serializers.ValidationError(
                f"Cannot transition from {current_status} to {value}"
            )
        return value

class TherapistApplicationSerializer(serializers.ModelSerializer):
    applicant_email = serializers.ReadOnlyField(source='applicant.email')
    applicant_full_name = serializers.SerializerMethodField()

    class Meta:
        model = TherapistApplication
        fields = [
            'id', 'applicant', 'applicant_email', 'applicant_full_name',
            'license_number', 'license_document', 'id_number', 'id_document',
            'professional_photo', 'motivation_statement', 'status', 'submitted_at',
            'reviewed_at', 'reviewer_notes'
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
        }

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
            'reviewed_at', 'reviewer_notes'
        ]
        read_only_fields = ['id', 'applicant', 'submitted_at', 'applicant_email', 'applicant_full_name']

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
            applicant.save()
        else:
            if applicant.is_verified:
                applicant.is_verified = False
                applicant.is_available = False
                applicant.save()
        instance.save()
        return instance
