from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from .models import User, TherapistApplication, JournalEntry, SessionRequest # Import all your models

# Define a custom UserAdmin to display extra fields for your custom User model
class CustomUserAdmin(BaseUserAdmin):
    # Customize the fields displayed in the list view
    list_display = (
        'email', 'first_name', 'last_name', 'is_staff',
        'is_therapist', 'is_verified', 'is_available'
    )
    # Customize fields for searching
    search_fields = ('email', 'first_name', 'last_name')
    # Customize fields for filtering
    list_filter = ('is_staff', 'is_active', 'is_therapist', 'is_verified', 'is_available')
    # Add new fieldsets to the user change form
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone', 'profile_picture', 'bio', 'years_of_experience', 'specializations', 'hourly_rate')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Therapist Status', {'fields': ('is_therapist', 'is_verified', 'is_available')}), # New fields for therapist status
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    # Define add_fieldsets for creating a new user (if different from fieldsets)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'password2'),
        }),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone', 'is_therapist')}),
    )
    ordering = ('email',)


# Admin configuration for TherapistApplication
@admin.register(TherapistApplication)
class TherapistApplicationAdmin(admin.ModelAdmin):
    list_display = (
        'applicant_email', 'applicant_full_name', 'status', 'submitted_at', 'reviewed_at'
    )
    list_filter = ('status', 'submitted_at')
    search_fields = ('applicant__email', 'applicant__first_name', 'applicant__last_name', 'license_number', 'id_number')
    readonly_fields = ('applicant', 'submitted_at') # These fields are set on creation, not edited by admin

    fieldsets = (
        (None, {'fields': ('applicant', 'motivation_statement', 'status', 'reviewer_notes')}),
        ('Credentials & Documents', {'fields': ('license_number', 'license_document', 'id_number', 'id_document', 'professional_photo')}),
        ('Timestamps', {'fields': ('submitted_at', 'reviewed_at')}),
    )

    # Method to display applicant's email in the list_display
    def applicant_email(self, obj):
        return obj.applicant.email
    applicant_email.short_description = 'Applicant Email'

    # Method to display applicant's full name in the list_display
    def applicant_full_name(self, obj):
        return obj.applicant.get_full_name()
    applicant_full_name.short_description = 'Applicant Name'

    # Override save_model to trigger logic in serializer's update method if needed
    # This ensures that when an admin changes the status to 'approved', the user's is_verified is also updated.
    def save_model(self, request, obj, form, change):
        if change: # Only on change/update, not initial creation via admin
            # Call super to save the application object first
            super().save_model(request, obj, form, change)
            
            # Re-fetch user to ensure we have the latest state, then update is_verified
            user_applicant = User.objects.get(pk=obj.applicant.pk)
            if obj.status == 'approved' and not user_applicant.is_verified:
                user_applicant.is_verified = True
                # If you want to copy bio/etc. from application to user directly from admin:
                user_applicant.bio = obj.motivation_statement # Using motivation as initial bio
                # You might need to update other fields like years_of_experience, specializations here
                # if they are part of the application form and you want them automatically copied.
                user_applicant.save()
            elif obj.status != 'approved' and user_applicant.is_verified:
                # If status changes from approved to rejected/pending, unverify the user
                user_applicant.is_verified = False
                user_applicant.save()
        else: # For new application creation through admin (less common for this flow)
            super().save_model(request, obj, form, change)


# Register CustomUserAdmin with your custom User model
admin.site.register(User, CustomUserAdmin)

# Register other models
admin.site.register(JournalEntry)
admin.site.register(SessionRequest)

# Unregister Group if you manage permissions solely through UserAdmin's groups field
# You might want to keep this if you plan to use Django's built-in group permissions
# admin.site.unregister(Group)
