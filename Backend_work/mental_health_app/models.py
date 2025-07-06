# File: Backend_work/mental_health_app/models.py
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.conf import settings 

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    phone = models.CharField(max_length=15, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    is_therapist = models.BooleanField(default=False)

    is_verified = models.BooleanField(default=False)
    bio = models.TextField(blank=True, null=True)
    years_of_experience = models.IntegerField(blank=True, null=True)
    specializations = models.CharField(max_length=255, blank=True, null=True)
    is_available = models.BooleanField(default=False)
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)


    license_credentials = models.CharField(max_length=100, blank=True, null=True, help_text="e.g., LMFT, LCSW, PhD")
    approach_modalities = models.TextField(blank=True, null=True, help_text="e.g., CBT, EMDR, Psychodynamic")
    languages_spoken = models.CharField(max_length=255, blank=True, null=True, help_text="Comma-separated list of languages")
    client_focus = models.TextField(blank=True, null=True, help_text="e.g., Adults, Teens, LGBTQ+, Couples")
    insurance_accepted = models.BooleanField(default=False)
    video_introduction_url = models.URLField(max_length=500, blank=True, null=True, help_text="Link to a brief video introduction")

    is_free_consultation = models.BooleanField(default=False)
    SESSION_MODES_CHOICES = [
        ('online', 'Online'),
        ('physical', 'Physical (In-Person)'), # Corrected typo "physical" to "Online & Physical" as it might be a typo
        ('both', 'Both Online & Physical'),
    ]
    session_modes = models.CharField(
        max_length=50,
        choices=SESSION_MODES_CHOICES,
        default='online',
        blank=True,
        null=True
    )
    physical_address = models.TextField(blank=True, null=True, help_text="Physical address for in-person sessions")


    # Required fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_short_name(self):
        return self.first_name

class TherapistApplication(models.Model):
    applicant = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='therapist_application'
    )

    # Credentials and documents
    license_number = models.CharField(max_length=100, unique=True)
    license_document = models.FileField(upload_to='therapist_docs/licenses/')
    id_number = models.CharField(max_length=100, unique=True)
    id_document = models.FileField(upload_to='therapist_docs/ids/')
    professional_photo = models.ImageField(upload_to='therapist_docs/photos/')


    motivation_statement = models.TextField()

    specializations = models.CharField(max_length=255, blank=True, null=True, help_text="Comma-separated list of specializations")

    years_of_experience = models.IntegerField(blank=True, null=True)
    license_credentials = models.CharField(max_length=100, blank=True, null=True)
    approach_modalities = models.TextField(blank=True, null=True)
    languages_spoken = models.CharField(max_length=255, blank=True, null=True)
    client_focus = models.TextField(blank=True, null=True)
    insurance_accepted = models.BooleanField(default=False)
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)


    is_free_consultation = models.BooleanField(default=False)
    SESSION_MODES_CHOICES = [
        ('online', 'Online'),
        ('physical', 'Physical (In-Person)'),
        ('both', 'Both Online & Physical'),
    ]
    session_modes = models.CharField(
        max_length=50,
        choices=SESSION_MODES_CHOICES,
        default='online',
        blank=True,
        null=True
    )
    physical_address = models.TextField(blank=True, null=True)


    # Status of the application
    APPLICATION_STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(
        max_length=10,
        choices=APPLICATION_STATUS_CHOICES,
        default='pending'
    )

    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewer_notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Therapist Applications'

    def __str__(self):
        return f"Application by {self.applicant.email} - Status: {self.status}"

class JournalEntry(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='journal_entries'
    )
    date = models.DateTimeField(auto_now_add=True)
    mood = models.CharField(max_length=50)
    entry = models.TextField()
    tags = models.JSONField(default=list)
    attachment_name = models.CharField(max_length=255, null=True, blank=True)
    attachment_file = models.FileField(upload_to='journal_attachments/', null=True, blank=True)

    class Meta:
        ordering = ['-date']
        verbose_name_plural = 'Journal Entries'

    def __str__(self):
        return f"{self.user.email} - {self.date.strftime('%Y-%m-%d')}"

class SessionRequest(models.Model):
    # User making the request (client)
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='session_requests_made'
    )
    # Therapist being requested
    therapist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='session_requests_received'
    )
    # Status of the request
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )
    requested_date = models.DateField(null=True, blank=True)
    requested_time = models.TimeField(null=True, blank=True)
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    session_duration = models.PositiveIntegerField(
        default=120,
        help_text="Duration in minutes"
    )
    session_notes = models.TextField(blank=True, null=True)
    is_paid = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Session Requests'

    def __str__(self):
        return f"Request from {self.client.email} to {self.therapist.email} - Status: {self.status}"

class Session(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    session_request = models.OneToOneField(SessionRequest, on_delete=models.CASCADE, related_name='session')
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_sessions')
    therapist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='therapist_sessions')

    session_date = models.DateField()
    session_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=120, help_text="Duration of the session in minutes")
    session_type = models.CharField(max_length=50, default='online')
    location = models.CharField(max_length=255, blank=True, null=True)
    zoom_meeting_url = models.URLField(max_length=500, blank=True, null=True, help_text="Zoom meeting URL for online sessions")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')

    # Fields for therapist notes after the session
    notes = models.TextField(blank=True, null=True)
    key_takeaways = models.TextField(blank=True, null=True)
    recommendations = models.TextField(blank=True, null=True)
    follow_up_required = models.BooleanField(default=False)
    next_session_date = models.DateField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Session for {self.client.email} with {self.therapist.email} on {self.session_date}"

class Payment(models.Model):
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments_made')
    therapist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments_received')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    # Status for the payment simulation: pending, completed, failed
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('used', 'Used')
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    session_request = models.OneToOneField(SessionRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment')

    # NEW M-Pesa specific fields
    checkout_request_id = models.CharField(max_length=100, blank=True, null=True, unique=True, help_text="Safaricom's CheckoutRequestID for STK Push")
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True, unique=True, help_text="Mpesa Receipt Number after successful transaction")

    class Meta:
        ordering = ['-payment_date']
        verbose_name_plural = 'Payments'

    def __str__(self):
        return f"Payment of {self.amount} by {self.client.email} to {self.therapist.email} - Status: {self.status}"


class TherapistAvailability(models.Model):
    DAYS_OF_WEEK = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]

    therapist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='availability'
    )
    day_of_week = models.CharField(max_length=10, choices=DAYS_OF_WEEK)
    start_time = models.TimeField(help_text="Start of available working hours for the day")
    end_time = models.TimeField(help_text="End of available working hours for the day")
    break_start_time = models.TimeField(null=True, blank=True, help_text="Start of an optional break (e.g., lunch)")
    break_end_time = models.TimeField(null=True, blank=True, help_text="End of an optional break (e.g., lunch)")
    slot_duration = models.PositiveIntegerField(
        default=120,
        help_text="Duration of each bookable session slot in minutes (e.g., 60 for 1-hour sessions)"
    )

    class Meta:
        unique_together = ('therapist', 'day_of_week')
        verbose_name_plural = 'Therapist Availabilities'
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.therapist.get_full_name()} - {self.day_of_week}: {self.start_time}-{self.end_time}"

# --- FIX APPLIED HERE: ChatRoom is defined BEFORE ChatMessage ---
class ChatRoom(models.Model):
    user1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_rooms_as_user1')
    user2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_rooms_as_user2')
    name = models.CharField(max_length=255, unique=True, help_text="Unique identifier for the chat room (e.g., chat_user1_user2)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user1', 'user2']
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Auto-generate room name
        if not self.name:
            # Ensure consistent naming regardless of user1/user2 order
            ids = sorted([self.user1.id, self.user2.id])
            self.name = f"chat_{ids[0]}_{ids[1]}"
        super().save(*args, **kwargs)

class ChatMessage(models.Model):
    """
    Model to store individual chat messages between users.
    """
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_chat_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_chat_messages', on_delete=models.CASCADE, null=True, blank=True)
    # A room_name can be used to identify a specific chat session or direct message pair
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    message_content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp'] # Order messages by time
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"

    def __str__(self):
        # Improved __str__ method based on whether it's a direct message or part of a room
        if self.chat_room:
            return f"Chat in room '{self.chat_room.name}' from {self.sender.email} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
        elif self.receiver:
            return f"Chat from {self.sender.email} to {self.receiver.email} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
        else:
            return f"Chat message from {self.sender.email} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"