# File: Backend_work/mental_health_app/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ChatMessage, ChatRoom, JournalEntry, TherapistApplication, SessionRequest, Session, Payment, TherapistAvailability
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
import json
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer



User = get_user_model()

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.ReadOnlyField(source='sender.email')
    receiver_email = serializers.ReadOnlyField(source='receiver.email')

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_email', 'receiver', 'receiver_email', 'chat_room', 'message_content', 'timestamp'] # Changed 'room_name' to 'chat_room'
        read_only_fields = ['sender', 'timestamp']

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating user accounts. Handles password
    validation and hashing.
    """
    password = serializers.CharField(
        write_only=True,
        required=False, # Changed to False for updates
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=False, # Changed to False for updates
        style={'input_type': 'password'}
    )
    is_verified = serializers.BooleanField(read_only=True)
    bio = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    specializations = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    is_available = serializers.BooleanField(required=False, default=False)
    # Re-added hourly_rate field declaration - it was REMOVED previously
    hourly_rate = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    # FIX: Changed from serializers.ImageField to serializers.URLField to accept Cloudinary URLs
    profile_picture = serializers.URLField(max_length=500, required=False, allow_null=True, allow_blank=True)

    license_credentials = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    approach_modalities = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    languages_spoken = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    client_focus = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    insurance_accepted = serializers.BooleanField(required=False, default=False)
    video_introduction_url = serializers.URLField(max_length=500, required=False, allow_null=True, allow_blank=True)

    is_free_consultation = serializers.BooleanField(required=False, default=False)
    SESSION_MODES_CHOICES = [
        ('online', 'Online'),
        ('physical', 'Physical (In-Person)'),
        ('both', 'Both Online & Physical'),
    ]
    session_modes = serializers.ChoiceField(choices=User.SESSION_MODES_CHOICES, required=False, allow_null=True)
    physical_address = serializers.CharField(required=False, allow_null=True, allow_blank=True)


    class Meta:
        model = User
        fields = [
            'id', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone', 'is_therapist',
            'is_verified', 'bio', 'years_of_experience', 'specializations',
            'is_available', 'hourly_rate', # <--- 'hourly_rate' IS NOW INCLUDED HERE
            'profile_picture',
            'license_credentials', 'approach_modalities', 'languages_spoken',
            'client_focus', 'insurance_accepted', 'video_introduction_url',
            'is_free_consultation', 'session_modes', 'physical_address'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'id': {'read_only': True},
            # Passwords are not required for PATCH operations
            'password': {'write_only': True, 'required': False},
            'password2': {'write_only': True, 'required': False},
        }

    def to_internal_value(self, data):
        """
        Custom handling for profile_picture and other fields
        before full validation, converting empty strings or single-item lists
        containing empty strings/None to None.
        """
        # Create a mutable copy of the data
        mutable_data = data.copy()

        # --- Specific handling for profile_picture ---
        profile_picture_value = mutable_data.get('profile_picture')
        if profile_picture_value is not None: # Only process if the field is present
            if profile_picture_value == '' or (isinstance(profile_picture_value, list) and len(profile_picture_value) == 1 and (profile_picture_value[0] == '' or profile_picture_value[0] is None)):
                mutable_data['profile_picture'] = None
            elif isinstance(profile_picture_value, list) and len(profile_picture_value) > 1:
                raise serializers.ValidationError({"profile_picture": "Profile picture cannot be a list with multiple values."})
            # If it's a valid URL string or None, it will pass through.

        # --- General normalization for other string/number fields ---
        fields_to_normalize_to_none = [
            'bio', 'years_of_experience', 'license_credentials', 'approach_modalities',
            'languages_spoken', 'client_focus', 'video_introduction_url',
            'physical_address', 'phone'
        ]
        for field_name in fields_to_normalize_to_none:
            value = mutable_data.get(field_name)
            if value is not None: # Only process if the field is present
                if value == '' or (isinstance(value, list) and len(value) == 1 and (value[0] == '' or value[0] is None)):
                    mutable_data[field_name] = None
                elif isinstance(value, list) and len(value) > 1:
                    raise serializers.ValidationError({field_name: f"{field_name} cannot be a list with multiple values."})

        # --- Handle specializations (comma-separated string) ---
        specializations = mutable_data.get('specializations')
        if specializations is not None: # Only process if the field is present
            if isinstance(specializations, list):
                # Filter out any empty strings or None from the list before joining
                cleaned_specializations = [s for s in specializations if isinstance(s, str) and s.strip() != '']
                mutable_data['specializations'] = ",".join(cleaned_specializations) if cleaned_specializations else None
            elif specializations == '':
                mutable_data['specializations'] = None

        # Now call the parent's to_internal_value with the potentially modified data
        return super().to_internal_value(mutable_data)

    def validate(self, attrs):
        """
        Custom validation to check for matching passwords and unique email.
        Handles partial updates gracefully.
        """
        # Only validate passwords if they are actually provided (for updates)
        if attrs.get('password') or attrs.get('password2'):
            if attrs.get('password') != attrs.get('password2'):
                raise serializers.ValidationError({"password": "Password fields didn't match."})
            try:
                # Validate password against instance for updates
                validate_password(attrs['password'], self.instance)
            except DjangoValidationError as e:
                raise serializers.ValidationError({"password": list(e.messages)})

        email = attrs.get('email')
        # Only check for unique email if creating a new user or email is being changed
        if self.instance is None or (email and self.instance.email != email):
            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": "This email is already in use."})

        # Removed the therapist-specific validation block from here.
        # These validations are now handled by the TherapistApplicationSerializer
        # or implicitly by the required=False and allow_null=True settings
        # on the fields themselves for profile updates.

        return attrs

    def create(self, validated_data):
        """
        Creates and returns a new User instance using the custom user manager.
        """
        validated_data.pop('password2', None)
        email = validated_data.pop('email')
        password = validated_data.pop('password')

        # Handle profile_picture for creation if it's a URL
        profile_picture_url = validated_data.pop('profile_picture', None)

        try:
            user = User.objects.create_user(email=email, password=password, **validated_data)
            if profile_picture_url:
                user.profile_picture = profile_picture_url
                user.save()
            return user
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)

    def update(self, instance, validated_data):
        """
        Updates a User instance, handling password changes correctly.
        """
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        validated_data.pop('password2', None)

        # Handle profile_picture update:
        # If profile_picture is provided in validated_data and it's None, clear the field.
        # Otherwise, if it's a URL, set it.
        # If not provided, leave the existing value.
        profile_picture_url = validated_data.pop('profile_picture', None)
        if profile_picture_url is not None: # If provided (could be a URL or explicit None)
            instance.profile_picture = profile_picture_url
        elif 'profile_picture' in validated_data and profile_picture_url is None:
            # This handles the case where the frontend explicitly sends profile_picture: null
            instance.profile_picture = None


        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

class RegisterSerializer(UserSerializer):
    """
    Serializer specifically for user registration, inherits all user creation
    logic from the main UserSerializer.
    """
    class Meta(UserSerializer.Meta):
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'password': {'write_only': True, 'required': True}, # Passwords required for registration
            'password2': {'write_only': True, 'required': True},
        }

class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login, validating credentials.
    """
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
    """
    Read-only serializer for public therapist profiles.
    """
    full_name = serializers.SerializerMethodField()
    # FIX: Change to SerializerMethodField to correctly return the URL
    profile_picture = serializers.SerializerMethodField()
    hourly_rate = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'full_name',
            'is_available', 'hourly_rate', # <--- 'hourly_rate' IS NOW INCLUDED HERE
            'profile_picture',
            'bio', 'years_of_experience', 'specializations',
            'license_credentials', 'approach_modalities', 'languages_spoken',
            'client_focus', 'insurance_accepted', 'video_introduction_url',
            'is_free_consultation', 'session_modes', 'physical_address'
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_profile_picture(self, obj):
        # Return the URL directly if it's a URLField on the model
        if obj.profile_picture:
            return obj.profile_picture
        return None

class JournalEntrySerializer(serializers.ModelSerializer):
    attachment_file = serializers.FileField(
        required=False,
        allow_null=True,
        write_only=True
    )
    # Added user_email field for admin panel display
    user_email = serializers.ReadOnlyField(source='user.email')


    class Meta:
        model = JournalEntry
        fields = [
            'id', 'date', 'mood', 'entry', 'tags',
            'attachment_name', 'attachment_file', 'user', 'user_email'
        ]
        read_only_fields = ['id', 'date', 'user', 'user_email']

    def create(self, validated_data):
        attachment_file = validated_data.pop('attachment_file', None)
        if attachment_file:
            validated_data['attachment_name'] = attachment_file.name
        return super().create(validated_data)

    def to_internal_value(self, data):
        """
        Handles converting stringified JSON for tags back to a list.
        """
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
    """
    A lightweight serializer for listing journal entries.
    """
    class Meta:
        model = JournalEntry
        fields = ['id', 'date', 'mood', 'tags', 'attachment_name']
        read_only_fields = fields


class SessionRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for clients creating and viewing session requests.
    """
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
    """
    Serializer for updating the status of a session request.
    """
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
    therapist_email = serializers.EmailField(source='therapist.email', read_only=True)
    session_request_is_paid = serializers.BooleanField(source='session_request.is_paid', read_only=True)
    # NEW: Add therapist's free consultation status
    therapist_is_free_consultation = serializers.BooleanField(source='therapist.is_free_consultation', read_only=True)


    class Meta:
        model = Session
        fields = [
            'id', 'client', 'therapist', 'session_request', 'session_date', 'session_time',
            'duration_minutes',
            'session_type', 'location',
            'status', 'notes', 'key_takeaways', 'recommendations', 'follow_up_required',
            'next_session_date', 'created_at', 'updated_at', 'zoom_meeting_url',
            'client_name', 'client_email', 'therapist_name', 'therapist_email','session_request_is_paid',
            'therapist_is_free_consultation' # NEW: Include in fields
        ]
        read_only_fields = [
            'id', 'client_name', 'client_email', 'therapist_name', 'therapist_email',
            'created_at', 'updated_at', 'therapist_is_free_consultation'
        ]


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

            # For professional_photo, if it's a FileField in TherapistApplication,
            # and profile_picture is URLField in User, you might need to handle Cloudinary upload here
            # or ensure professional_photo is also a URLField in TherapistApplication if it stores URLs.
            # Assuming professional_photo in TherapistApplication is also a URLField or you handle conversion
            if instance.professional_photo:
                applicant.profile_picture = instance.professional_photo # Assign URL directly

            if not instance.is_free_consultation and instance.hourly_rate is not None:
                applicant.hourly_rate = instance.hourly_rate
            elif instance.is_free_consultation:
                applicant.hourly_rate = None

            applicant.save()
        else:
            if applicant.is_verified:
                applicant.is_verified = False
                applicant.is_available = False
                applicant.save()

        instance.save()
        return instance

class PaymentSerializer(serializers.ModelSerializer):
    client = serializers.HiddenField(default=serializers.CurrentUserDefault())

    # MODIFIED: Removed read_only=True to make these fields writable
    checkout_request_id = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)
    mpesa_receipt_number = serializers.CharField(max_length=50, required=False, allow_null=True, allow_blank=True)
    transaction_id = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True) # MODIFIED: transaction_id writable

    session_request = serializers.PrimaryKeyRelatedField(
        queryset=SessionRequest.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Payment
        fields = [
            'id', 'client', 'therapist', 'amount', 'payment_date', 'status',
            'transaction_id', 'session_request', 'checkout_request_id', 'mpesa_receipt_number'
        ]
        # MODIFIED: Removed checkout_request_id, mpesa_receipt_number, and transaction_id from read_only_fields
        read_only_fields = [
            'id', 'payment_date', 'status'
        ]

class TherapistAvailabilitySerializer(serializers.ModelSerializer):
    therapist_name = serializers.CharField(source='therapist.get_full_name', read_only=True)

    class Meta:
        model = TherapistAvailability
        fields = [
            'id', 'therapist', 'therapist_name', 'day_of_week', 'start_time',
            'end_time', 'break_start_time', 'break_end_time', 'slot_duration'
        ]
        read_only_fields = ['id', 'therapist', 'therapist_name']

    def validate(self, data):
        """
        Custom validation to ensure end_time is after start_time and
        break times are within working hours and break_end_time is after break_start_time.
        """
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        break_start_time = data.get('break_start_time')
        break_end_time = data.get('break_end_time')

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {"end_time": "End time must be after start time."}
            )

        if break_start_time and break_end_time:
            if break_start_time >= break_end_time:
                raise serializers.ValidationError(
                    {"break_end_time": "Break end time must be after break start time."}
                )
            if (start_time and break_start_time < start_time) or \
               (end_time and break_end_time > end_time):
                raise serializers.ValidationError(
                    {"break_times": "Break times must be within working hours."}
                )
            if (start_time and break_end_time <= start_time) or \
               (end_time and break_start_time >= end_time):
                raise serializers.ValidationError(
                    {"break_times": "Break must be within the working hours, not before start or after end."}
                )

        return data
    
class UserChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']

class ChatRoomSerializer(serializers.ModelSerializer):
    user1 = UserChatSerializer(read_only=True)
    user2 = UserChatSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    last_message_timestamp = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'user1', 'user2', 'last_message', 'last_message_timestamp']

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        return last_msg.message_content if last_msg else None

    def get_last_message_timestamp(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        return last_msg.timestamp if last_msg else None

