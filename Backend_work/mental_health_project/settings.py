from pathlib import Path
from datetime import timedelta
import dj_database_url
from dotenv import load_dotenv
import os
import cloudinary

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-default-key')
DEBUG = os.getenv('DJANGO_DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'cloudinary',
    'cloudinary_storage',
    'mental_health_app',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist', 
    'corsheaders',
    'channels', 
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    )
}

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "https://mentalhealth10.vercel.app",
]

# CORS_ALLOW_ALL_HEADERS = True
#  [
#     'accept',
#     'accept-encoding',
#     'authorization',
#     'content-type',
#     'dnt',
#     'origin',
#     'user-agent',
#     'x-csrftoken',
#     'x-requested-with',
# ]

CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_HTTPONLY = True

ROOT_URLCONF = 'mental_health_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mental_health_project.wsgi.application'

# ASGI Application for Channels (WebSockets)
ASGI_APPLICATION = 'mental_health_project.asgi.application' 

# Channel Layer Configuration
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.pubsub.RedisPubSubChannelLayer',
        'CONFIG': {
          
            "hosts": [('https://mental-health-knp6.onrender.com', 6379)],
        },
    },
}


# if 'DATABASE_URL' in os.environ:
#     DATABASES = {
#         'default': dj_database_url.config(conn_max_age=600)
#     }
# else:
#     DATABASES = {
#         'default': {
#             'ENGINE': 'django.db.backends.postgresql',
#             'NAME': 'mental_health',
#             'USER': 'mental_health_user',
#             'PASSWORD': '123456',
#             'HOST': 'localhost',
#             'PORT': '5432',
#             'OPTIONS': {
#                 'client_encoding': 'UTF8',
#             },
#         }
#     }

DATABASES = {
    'default': dj_database_url.parse("postgresql://mental_health_xxgs_user:GuNNLiYC3XiqybXTc94NzVDdbdIxd9UZ@dpg-d1mqfgje5dus73804u0g-a.oregon-postgres.render.com/mental_health_xxgs")}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

CORS_ALLOW_CREDENTIALS = True
# CORS_ALLOW_ALL_ORIGINS = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / "static"]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'email',
    'USER_ID_CLAIM': 'email',
}

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://mentalhealth10.vercel.app",
    "https://mental-health-knp6.onrender.com",
]

AUTH_USER_MODEL = 'mental_health_app.User' 

# BEGIN MODIFICATION FOR CLOUDINARY CONFIGURATION
# Remove or comment out the hardcoded block like this:
# cloudinary.config(
#     cloud_name='dgdf0svqx',
#     api_key='563553895748169',
#     api_secret='V5pzLDiadn6UCYyCkMxOSMQqeGg'
# )

CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', 'dgdf0svqx') 
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '563553895748169') 
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', 'V5pzLDiadn6UCYyCkMxOSMQqeGg') 

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)



MEDIA_URL = '/media/'
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

NODE_MPESA_SERVICE_URL = os.environ.get('NODE_MPESA_SERVICE_URL', 'http://localhost:3000') 
NODE_MPESA_SECRET_KEY = os.environ.get('NODE_MPESA_SECRET_KEY', 'your_django_node_shared_secret_key') 



MPESA_CONSUMER_KEY = os.getenv('MPESA_CONSUMER_KEY', '')
MPESA_CONSUMER_SECRET = os.getenv('MPESA_CONSUMER_SECRET', '')
MPESA_SHORTCODE = os.getenv('MPESA_SHORTCODE', '')
MPESA_PASSKEY = os.getenv('MPESA_PASSKEY', '')
MPESA_ENVIRONMENT = os.getenv('MPESA_ENVIRONMENT', 'sandbox')
MPESA_BASE_URL = 'https://sandbox.safaricom.co.ke' if MPESA_ENVIRONMENT == 'sandbox' else 'https://api.safaricom.co.ke'

MPESA_STK_CALLBACK_URL = "https://155d-102-219-208-122.ngrok-free.app/api/mpesa/callback/"

GEMINI_API_KEY='AIzaSyCzfeeSL53b5qVuGp2UyKyWQJ_rctM3Kjc',
YOUTUBE_API_KEY='AIzaSyAP8LY0p-ah_dXTWxcg81kt63JqmUrVWuw'