# File: Backend_work/mental_health_app/models.py
# Add the following imports if not already present
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.conf import settings
from django.utils import timezone

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
    
    # Therapist-specific fields (already existing in User model)
    is_verified = models.BooleanField(default=False)  # True if therapist application is approved
    bio = models.TextField(blank=True, null=True)  # Short description about the therapist
    years_of_experience = models.IntegerField(blank=True, null=True)
    specializations = models.CharField(max_length=255, blank=True, null=True)  # e.g., "Anxiety, Depression, Trauma"
    is_available = models.BooleanField(default=False)  # Indicates if therapist is actively taking new clients/sessions
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)  # Price per hour for sessions

    # NEW: Additional therapist profile fields for display
    license_credentials = models.CharField(max_length=100, blank=True, null=True, help_text="e.g., LMFT, LCSW, PhD")
    approach_modalities = models.TextField(blank=True, null=True, help_text="e.g., CBT, EMDR, Psychodynamic")
    languages_spoken = models.CharField(max_length=255, blank=True, null=True, help_text="Comma-separated list of languages")
    client_focus = models.TextField(blank=True, null=True, help_text="e.g., Adults, Teens, LGBTQ+, Couples")
    insurance_accepted = models.BooleanField(default=False)
    video_introduction_url = models.URLField(max_length=500, blank=True, null=True, help_text="Link to a brief video introduction")
    
    # NEW fields for free consultation, session modes, and physical address
    is_free_consultation = models.BooleanField(default=False) # If true, implies free initial consultation/session
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
    
    # Personal statement/motivation
    motivation_statement = models.TextField()

    specializations = models.CharField(max_length=255, blank=True, null=True, help_text="Comma-separated list of specializations")

    # NEW: Fields for additional therapist profile information, captured during application
    # These will be transferred to the User profile upon approval
    years_of_experience = models.IntegerField(blank=True, null=True) # Added from user request
    license_credentials = models.CharField(max_length=100, blank=True, null=True)
    approach_modalities = models.TextField(blank=True, null=True)
    languages_spoken = models.CharField(max_length=255, blank=True, null=True)
    client_focus = models.TextField(blank=True, null=True)
    insurance_accepted = models.BooleanField(default=False)

    # NEW fields for free consultation, session modes, and physical address
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
        default=60,
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
    session_type = models.CharField(max_length=50, default='online') # e.g., 'online', 'physical'
    location = models.CharField(max_length=255, blank=True, null=True) # Used if session_type is physical
    zoom_meeting_url = models.URLField(max_length=500, blank=True, null=True, help_text="Zoom meeting URL for online sessions") # NEW FIELD
    
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
        ('used', 'Used') # New status to mark a payment as used for a session request
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    # Link to the session request once it's made (optional, can be null until request is made)
    session_request = models.OneToOneField(SessionRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment')

    class Meta:
        ordering = ['-payment_date']
        verbose_name_plural = 'Payments'

    def __str__(self):
        return f"Payment of {self.amount} by {self.client.email} to {self.therapist.email} - Status: {self.status}"