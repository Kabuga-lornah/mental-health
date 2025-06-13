from django.urls import path, include  
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, UserView, JournalEntryView, JournalEntryDetailView

urlpatterns = [
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/user/', UserView.as_view(), name='user'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/journal/', JournalEntryView.as_view(), name='journal-list'),
    path('api/journal/<int:pk>/', JournalEntryDetailView.as_view(), name='journal-detail'),
]