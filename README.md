# MindWell: Your Holistic Path to Mental Wellness

## Project Overview

MindWell is a pioneering digital platform meticulously crafted to empower individuals in Kenya to proactively manage their mental well-being. It aims to bridge the gap between accessible self-help tools and professional mental health services, offering a holistic approach to mental wellness.

## Features

MindWell provides a suite of features designed to support users on their wellness journey:

* **Smart Digital Journaling**:
    * Capture moods and thoughts.
    * Track emotional patterns and triggers.
    * Utilize guided prompts for reflection and self-discovery.
    * Attach files (images, voice notes) to journal entries.
* **Professional Therapist Connections**:
    * Browse and connect with certified and vetted Kenyan therapists.
    * Filter therapists by specialization, session mode (online/in-person), and pricing (free consultation or hourly rate).
    * Secure and convenient session booking (video, audio, text).
    * Therapists undergo a rigorous vetting process and must be licensed and registered with the Counsellors and Psychologists Board (CPB) in Kenya.
    * Therapists can manage their availability and session notes.
* **AI-Powered Support**:
    * **MindWell AI Chatbot (Soni)**: An empathetic AI companion for real-time listening and general emotional support. It can offer general self-care ideas and provides immediate crisis redirection for emergencies.
    * **Personalized Meditation Recommendations**: Analyze your journal entries to receive AI-powered recommendations for specific meditation or mindfulness techniques tailored to your emotional state, along with relevant YouTube guided video suggestions.
* **Self-Care & Meditation Library**:
    * Access a comprehensive collection of curated meditations, breathing exercises, and mindfulness techniques.
    * Explore insightful articles and videos to support daily wellness.
    * Includes relaxing music and sounds for stress reduction, sleep, and anxiety relief.
* **Secure Authentication & User Management**:
    * User and Therapist registration and login.
    * Admin panel for managing therapist applications, users, sessions, journal entries, and payments.
    * Secure JWT-based authentication.
* **Real-time Chat**:
    * Dedicated chat interface for clients to communicate with their booked therapists.
    * Real-time messaging via WebSockets.
* **Payment Integration (M-Pesa Simulation)**:
    * Simulated M-Pesa STK Push integration for session payments.

## Technologies Used

### Backend

* **Django 5.2.3**: Web framework.
* **Django REST Framework (DRF)**: For building RESTful APIs.
* **Django REST Framework Simple JWT**: For JWT authentication.
* **Django Channels**: For WebSocket communication (real-time chat).
* **Redis**: Channel layer backend for Django Channels.
* **PostgreSQL**: Database.
* **Cloudinary**: Cloud-based image and file management.
* **Axios**: HTTP client for API requests.
* **Google Generative AI (Gemini 1.0 Pro / 1.5 Flash)**: For AI chatbot and personalized recommendations.
* **YouTube Data API v3**: For searching and recommending meditation videos.
* **M-Ppesa Daraja API (Sandbox)**: For simulated payment processing.

### Frontend

* **React 18.3.1**: JavaScript library for building user interfaces.
* **Vite 6.3.5**: Fast build tool for modern web projects.
* **Tailwind CSS 4.1.11**: Utility-first CSS framework.
* **MUI (Material-UI) 7.2.0**: React component library for a sleek UI.
* **date-fns**: For date manipulation.
* **React Router DOM v7**: For navigation and routing.
* **Recharts**: For data visualization in the dashboard.

## Getting Started

### Prerequisites

* Python 3.9+
* Node.js 18+
* npm or yarn
* PostgreSQL installed and running
* Redis installed and running
* Cloudinary Account
* Google Cloud Project with Gemini API and YouTube Data API v3 enabled
* Safaricom Daraja Sandbox Account (for M-Pesa simulation)
* ngrok (or a similar tool for exposing local server to the internet for M-Pesa callback)

### Installation

#### 1. Clone the repository

```bash
git clone <repository_url>
cd mental-health # or the root directory of your cloned project
````

#### 2\. Backend Setup

```bash
# Navigate to the backend directory
cd Backend_work

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate # On Windows: `venv\Scripts\activate`

# Install backend dependencies
pip install -r requirements.txt

# Create a .env file in `Backend_work/` and add your environment variables:
# DJANGO_SECRET_KEY='your_very_secret_key'
# DJANGO_DEBUG='True'
# CLOUDINARY_CLOUD_NAME='your_cloudinary_cloud_name'
# CLOUDINARY_API_KEY='your_cloudinary_api_key'
# CLOUDINARY_API_SECRET='your_cloudinary_api_secret'
# MPESA_CONSUMER_KEY='your_mpesa_consumer_key'
# MPESA_CONSUMER_SECRET='your_mpesa_consumer_secret'
# MPESA_SHORTCODE='your_mpesa_shortcode' # e.g., 174379 for sandbox
# MPESA_PASSKEY='your_mpesa_passkey'
# MPESA_ENVIRONMENT='sandbox' # or 'production'
# MPESA_STK_CALLBACK_URL='your_ngrok_https_url/api/mpesa/callback/'
# GEMINI_API_KEY='your_google_gemini_api_key'
# YOUTUBE_API_KEY='your_google_youtube_api_key'
# NODE_MPESA_SERVICE_URL='http://localhost:3000' # If using a separate Node.js service for M-Pesa, otherwise leave commented or adjust
# NODE_MPESA_SECRET_KEY='your_django_node_shared_secret_key' # If using Node.js service

# Configure your PostgreSQL database in settings.py or via DATABASE_URL env var
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': 'mental_health',
#         'USER': 'mental_health_user',
#         'PASSWORD': '123456',
#         'HOST': 'localhost',
#         'PORT': '5432',
#     }
# }

# Apply database migrations
python manage.py makemigrations mental_health_app
python manage.py migrate

# Create a superuser for admin access
python manage.py createsuperuser

# Run the Django development server
python manage.py runserver
# For WebSockets to work, you'll need to run this alongside a Dpahne server or uvicorn
# daphne -b 127.0.0.1 -p 8000 mental_health_project.asgi:application
# For local development, `python manage.py runserver` might be enough for HTTP,
# but for WebSockets, ensure your ASGI server is correctly configured.
```

#### 3\. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend_work

# Install frontend dependencies
npm install # or yarn install

# Create a .env file in `frontend_work/` for client-side environment variables if needed.
# For API keys exposed in the frontend, remember this is INSECURE for production.
# For example, AIzaSyCzfeeSL53b5qVuGp2UyKyWQJ_rctM3Kjc is hardcoded in AIChatbot.jsx and Dashboard.jsx
# AIzaSyAP8LY0p-ah_dXTWxcg81kt63JqmUrVWuw is hardcoded in Meditation.jsx and Dashboard.jsx

# Run the React development server
npm run dev # or yarn dev
```

#### 4\. M-Pesa Callback (ngrok)

For M-Pesa STK Push callback to work in a local development environment, you need to expose your Django server to the internet.

1.  **Download ngrok**: [https://ngrok.com/download](https://ngrok.com/download)
2.  **Run ngrok**:
    ```bash
    ngrok http 8000
    ```
    This will give you a public HTTPS URL (e.g., `https://abcdef123456.ngrok-free.app`).
3.  **Update `MPESA_STK_CALLBACK_URL`**: Set this URL in your `Backend_work/.env` file:
    ```
    MPESA_STK_CALLBACK_URL="[https://abcdef123456.ngrok-free.app/api/mpesa/callback/](https://abcdef123456.ngrok-free.app/api/mpesa/callback/)"
    ```

## Usage

1.  **Access the application**: Once both the backend and frontend servers are running, open your web browser and navigate to `http://localhost:5173`.
2.  **Register/Login**: Create a new user account. You can register as a regular user or apply as a therapist.
3.  **Explore Features**:
      * **Journaling**: Start writing in your digital journal.
      * **Find a Therapist**: Browse available therapists and send session requests.
      * **Meditation Hub**: Discover guided meditations and use AI-powered recommendations.
      * **Dashboard**: View your session requests, scheduled sessions, and progress.
      * **Chat with Soni**: Engage with the AI companion for support.
      * **Therapist Features**: If you registered as a therapist and your application is approved by an admin, you can manage your profile, availabilities, and sessions from the therapist dashboard.
      * **Admin Panel**: If you created a superuser account, access the admin panel at `http://localhost:8000/admin/` to manage users, therapist applications, sessions, journal entries, and view analytics.

## API Endpoints (Overview)

The backend provides a comprehensive set of API endpoints:

  * `/api/register/`: User registration.
  * `/api/login/`: User login.
  * `/api/user/`: Retrieve/update current user profile.
  * `/api/token/refresh/`: Refresh JWT tokens.
  * `/api/journal/`: Create/list journal entries.
  * `/api/journal/<int:pk>/`: Retrieve/update/delete a specific journal entry.
  * `/api/therapist-applications/submit/`: Submit a therapist application.
  * `/api/therapist-applications/me/`: View your therapist application status.
  * `/api/admin/therapist-applications/`: Admin: List therapist applications.
  * `/api/admin/therapist-applications/<int:pk>/`: Admin: Review/update therapist application.
  * `/api/admin/users/`: Admin: List all users.
  * `/api/admin/sessions/`: Admin: List all sessions.
  * `/api/admin/journal-entries/`: Admin: List all journal entries (content is private for regular viewing).
  * `/api/admin/payments/`: Admin: List all payments.
  * `/api/therapists/`: List available therapists (client-facing).
  * `/api/therapists/<int:pk>/`: Retrieve details of a specific therapist.
  * `/api/therapists/me/availability/`: Therapist: Manage their availability slots.
  * `/api/therapists/<int:therapist_id>/available-slots/`: Client: Get available slots for a therapist.
  * `/api/session-requests/`: Client: Create a session request.
  * `/api/therapist/session-requests/`: Therapist: List received session requests.
  * `/api/client/session-requests/`: Client: List sent session requests.
  * `/api/session-requests/<int:pk>/`: Client/Therapist: Update/delete a session request.
  * `/api/therapist/sessions/`: Therapist: List their scheduled/completed sessions.
  * `/api/therapist/sessions/create/`: Therapist: Create a session from a request.
  * `/api/therapist/sessions/<int:pk>/`: Therapist: Update a specific session (e.g., add notes).
  * `/api/client/sessions/`: Client: List their scheduled/completed sessions.
  * `/api/payments/initiate/`: Client: Initiate M-Pesa STK Push for payment.
  * `/api/payments/status/<int:therapist_id>/`: Client: Check payment status for a therapist.
  * `/api/mpesa/callback/`: M-Pesa callback URL (configured via ngrok for local dev).
  * `/ai/recommendations/`: Get AI-powered meditation recommendations based on journal entries.
  * `/ai/chat/`: Interact with the AI chatbot (Soni).
  * `/ws/chat/<room_name>/`: WebSocket endpoint for real-time chat.

