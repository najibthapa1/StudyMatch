# 🆂🅼 StudyMatch 
#### Collaborate Smarter, Not Harder

> **A platform to connect students based on shared study goals, interests, and academic pursuits. Match with peers, form study groups, and collaborate on your learning journey.**

![StudyMatch](https://img.shields.io/badge/Version-1.0.0-blue) ![Django](https://img.shields.io/badge/Django-5.2.8-green) ![React](https://img.shields.io/badge/React-Latest-blue) ![Python](https://img.shields.io/badge/Python-3.10-blue)

---

## Table of Contents

- [About StudyMatch](#-about-studymatch)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Core Modules](#-core-modules)
- [Frontend Pages & Navigation](#-frontend-pages--navigation)
- [API Documentation](#-api-documentation)
- [Database Models](#-database-models)
- [User Guide](#-user-guide)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## About StudyMatch

**StudyMatch** is a web-based platform designed to help students find study partners based on:
- **Academic Interests**: Share courses, subjects, and learning goals
- **Personal Interests**: Connect through hobbies and extracurricular activities
- **Study Year/Level**: Match with peers in your academic year
- **University**: Exclusive to Islington College students (expandable to other institutions)

The platform facilitates:
- **1-to-1 Connections**: Direct messaging between matched students
- **Study Groups**: Create or join guild-based study communities
- **Events**: Organize and attend study events, workshops, competitions
- **Admin Management**: Moderation, user reports, event approvals

---

## Features

### User Authentication & Profiles
- **Email-Based Registration** with college domain validation
- **JWT Token Authentication** for secure API access
- **Email Verification** via 6-digit code
- **Password Reset** functionality
- **Profile Management** with initials, study goals, and activity tracking
- **User Suspension** for moderation

### Smart Discovery
- **Intelligent Matching Algorithm** using:
  - Interest matching (40% weight)
  - Course similarity (30% weight)
  - Academic year proximity (20% weight)
  - University matching (10% weight)
- **String Similarity Matching** for fuzzy course/interest matching
- **Match Scoring** with weighted calculations

### Communication
- **Real-Time Chat** via WebSockets (Channels)
- **Direct Messaging** between matched users
- **Conversation Threading** with automatic participant sorting
- **Message Read Status** tracking
- **Typing Indicators** (who's typing)
- **Soft Delete** for messages (privacy preservation)

### Guild Management
- **Create & Join Guilds** (study communities)
- **Guild Membership Tracking**
- **Event Management** within guilds
- **Event Categories**: Workshops, Study Groups, Competitions, Networking, Symposiums

### Events
- **Event Creation** with title, description, date, time, venue
- **Pre-Join Registration** (users pre-join before confirmation)
- **Auto-Confirmation** when 3+ users pre-join
- **Event Status**: Pending → Confirmed → Cancelled
- **Attendee Tracking** (pre-joined count, confirmed attendees)
- **Event Photos** (image uploads)
- **Check Event Ended**: Auto-detect expired events

### Notifications
- **User Notifications** for matches, messages, event updates
- **Admin Notifications** for reports, event confirmations
- **Real-Time Updates** via WebSocket

### Admin Dashboard
- **User Management**: Suspend/unsuspend users
- **Report Management**: Review and resolve user reports
- **Event Approvals** and management
- **System Monitoring**: Track user activities
- **Admin Notifications** for critical events

### Advanced Features
- **Connection Requests**: Mutual follow/connection system
- **Study Goals & Activities**: Track learning progress
- **User Reports**: Report inappropriate behavior
- **Typing Indicators**: See who's typing in chat
- **Image Uploads**: Profile pictures, event photos (Cloudinary)

---

##  Tech Stack

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Django** | Web Framework | 5.2.8 |
| **Python** | Language | 3.10+ |
| **PostgreSQL** | Database | Latest |
| **Django REST Framework** | API Development | 3.16.1 |
| **Django Channels** | WebSockets | 4.3.2 |
| **JWT** | Authentication | 5.5.1 |
| **Cloudinary** | Image Storage | 1.44.1 |
| **Redis** | Caching/Channels | Latest |

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18+ |
| **Vite** | Build Tool | Latest |
| **Tailwind CSS** | Styling | Latest |
| **Radix UI** | Component Library | Latest |
| **WebSocket** | Real-Time Chat | Native |
| **Axios** | HTTP Client | Latest |

### Testing
| Technology | Purpose |
|------------|---------|
| **Django TestCase** | Unit/Integration Tests |
| **pytest** | Complex Algorithm Testing |
| **pytest-django** | Django Integration |

---

##  System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   STUDYMATCH PLATFORM                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐                  ┌─────────────┐   │
│  │   Frontend      │                  │   Backend   │   │
│  │   (React)       │◄────────────────►│   (Django)  │   │
│  │   Vite + TC     │   REST API       │   DRF       │   │
│  │   WebSocket     │   WebSocket      │   Channels  │   │
│  └─────────────────┘                  └─────────────┘   │
│        │                                     │           │
│        │                                     │           │
│  ┌─────▼──────────────┐            ┌────────▼─────────┐ │
│  │   UI Components    │            │  Core Modules    │ │
│  │  - Login/Register  │            │  - Auth          │ │
│  │  - Discovery       │            │  - Profiles      │ │
│  │  - Chat           │            │  - Matching      │ │
│  │  - Guilds         │            │  - Chat          │ │
│  │  - Events         │            │  - Guilds        │ │
│  │  - Admin Panel    │            │  - Events        │ │
│  └────────────────────┘            │  - Connections   │ │
│                                    │  - Notifications │ │
│                                    │  - Admin Mgmt    │ │
│                                    └──────────────────┘ │
│                                                           │
│  ┌────────────────────┐                 ┌────────────┐   │
│  │  External Services │                 │ Database   │   │
│  │  - Cloudinary      │                 │ PostgreSQL │   │
│  │  - Redis           │                 └────────────┘
│  │  - Email Service   │                                   │
│  └────────────────────┘                                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before you begin, ensure you have installed:

### System Requirements
- **Python** 3.10 or higher
- **Node.js** 16+ and **npm** 8+
- **PostgreSQL** 12+ (or use SQLite for development)
- **Redis** 6+ (for real-time features and caching)
- **Git** for version control

### Verify Installation
```bash
# Check Python
python3 --version

# Check Node.js and npm
node --version
npm --version

# Check Git
git --version
```

---

## Installation & Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/StudyMatch.git

# Navigate to project directory
cd StudyMatch

# Verify structure
ls -la  # Should show: backend/, frontend/, .git, etc.
```

---

### Backend Setup

#### Step 2: Create and Activate Python Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv sm_env

# Activate virtual environment
# On macOS/Linux:
source sm_env/bin/activate

# On Windows:
sm_env\Scripts\activate

# Verify activation (prompt should show (sm_env))
```

#### Step 3: Install Dependencies

```bash
# Install all required packages
pip install -r requirements.txt

# Verify installation
pip list | grep -E "Django|djangorestframework|channels"
```

#### Step 4: Environment Configuration

Environment variables are secret settings (passwords, API keys, etc.) stored in a `.env` file.

```bash
# Copy the template file
cp .env.example .env

# Open .env with your editor
# On macOS:
nano .env
# or
vim .env

# On Windows:
notepad .env
# or use VS Code
```

**What to fill in:**

| Variable | Example | Notes |
|----------|---------|-------|
| `SECRET_KEY` | (auto-generate) | For Django encryption |
| `DEBUG` | `True` | Set to False in production |
| `DB_NAME` | `studymatch_db` | PostgreSQL database name |
| `DB_USER` | `postgres` | Database username |
| `DB_PASSWORD` | `your_password` | Database password |
| `EMAIL_HOST_USER` | `your@gmail.com` | For sending emails |
| `EMAIL_HOST_PASSWORD` | `app_password` | Gmail app password (16 chars) |
| `CLOUDINARY_*` | (from cloudinary.com) | For image uploads |

**How to get Gmail App Password:**
1. Enable 2-Factor Authentication on Gmail
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Windows Computer"
4. Copy the 16-character password
5. Paste in EMAIL_HOST_PASSWORD


#### Step 5: Database Setup

```bash
# Apply migrations
python3 manage.py migrate

# Create a superuser account (for admin access)
python3 manage.py createsuperuser

# When prompted:
# Email: admin@islingtoncollege.edu.np
# Password: (create a strong password)

# (Optional) Load sample data
python3 manage.py shell < seed_data.py  # if seed file exists
```

#### Step 6: Verify Backend

```bash
# Run Django development server
python3 manage.py runserver

# Expected output:
# Starting development server at http://127.0.0.1:8000/
# Quit the server with CONTROL-C.
```

Open browser: `http://localhost:8000/api/` - Should see Django REST API interface

---

### Frontend Setup

#### Step 7: Navigate to Frontend

```bash
cd ../frontend/studymatch_frontend  # From project root
```

#### Step 8: Install Dependencies

```bash
# Install npm packages
npm install

# Verify installation
npm list | head -20
```

#### Step 9: Environment Configuration

```bash
# Check if .env exists
cat .env

# If it doesn't exist, create one:
echo "VITE_API_URL=http://localhost:8000/api/" > .env
echo "VITE_WS_URL=ws://localhost:8000/ws/" >> .env

# Verify:
cat .env
# Should show the two lines above
```
---

#### Step 10: Run Frontend

```bash
# Start development server
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

---

## Running the Application

### Complete Startup Process

**Terminal 1 - Backend (from backend/ directory)**
```bash
cd backend
source sm_env/bin/activate  # Activate virtual environment
python3 manage.py runserver
# http://localhost:8000
```

**Terminal 2 - Frontend (from frontend/studymatch_frontend/ directory)**
```bash
cd frontend/studymatch_frontend
npm run dev
# http://localhost:5173
```

**Terminal 3 - Redis (if using real-time features)**
```bash
redis-server
# Redis server running on port 6379
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/api/schema/

---

## 📁 Project Structure

```
StudyMatch/
├── backend/                           # Django Backend
│   ├── manage.py                      # Django management script
│   ├── requirements.txt               # Python dependencies
│   ├── pytest.ini                     # Pytest configuration
│   ├── .env                           # Environment variables
│   ├── .env.example                   # Template for .env
│   │
│   ├── studymatch_backend/            # Django project settings
│   │   ├── settings.py                # Settings (DB, apps, middleware)
│   │   ├── urls.py                    # Root URL configuration
│   │   ├── asgi.py                    # ASGI config (WebSockets)
│   │   └── wsgi.py                    # WSGI config (HTTP)
│   │
│   ├── authentication/                # User auth module
│   │   ├── models.py                  # User model
│   │   ├── views.py                   # Registration, login, email verification
│   │   ├── serializers.py             # API serializers
│   │   ├── urls.py                    # Auth endpoints
│   │   └── tests/
│   │       └── test_authentication.py 
│   │
│   ├── user_profile/                  # User profiles & goals
│   │   ├── models.py                  # Profile, StudyGoal, Activity
│   │   ├── views.py                   # Profile CRUD, goals
│   │   ├── signals.py                 # Auto-create profile on user creation
│   │   └── tests/
│   │       └── test_user_profile.py   
│   │
│   ├── discovery/                     # Smart matching algorithm
│   │   ├── models.py                  # MatchScore model
│   │   ├── matching.py                # Core matching logic
│   │   ├── views.py                   # Discovery endpoints
│   │   └── tests/
│   │       └── test_discovery.py     
│   │
│   ├── chat/                          # Real-time messaging
│   │   ├── models.py                  # Conversation, Message, TypingIndicator
│   │   ├── views.py                   # Chat endpoints
│   │   ├── consumers.py               # WebSocket handlers
│   │   └── tests/
│   │       └── test_chat.py           
│   │
│   ├── connection/                    # User connections
│   │   ├── models.py                  # ConnectionRequest
│   │   ├── views.py                   # Send/accept requests
│   │   └── tests/
│   │       └── test_connection.py     
│   │
│   ├── guild/                         # Study communities
│   │   ├── models.py                  # Guild, Event, EventParticipant
│   │   ├── views.py                   # Guild/Event CRUD
│   │   ├── urls.py                    # Guild endpoints
│   │   └── tests/
│   │       └── test_guild.py          
│   │
│   ├── notification/                  # Notifications system
│   │   ├── models.py                  # UserNotification, AdminNotification
│   │   ├── views.py                   # Fetch notifications
│   │   ├── service.py                 # Notification creation logic
│   │   └── tests/
│   │       └── test_notification.py   
│   │
│   └── administration/                # Admin functionality
│       ├── models.py                  # UserReport, UserSuspension
│       ├── views.py                   # Report/suspension management
│       ├── urls.py                    # Admin endpoints
│       └── tests/
│           └── test_administration.py 
│
├── frontend/                          # React Frontend
│   └── studymatch_frontend/
│       ├── package.json               # NPM dependencies
│       ├── .env                       # API configuration
│       ├── vite.config.js             # Vite build config
│       ├── tailwind.config.js         # Tailwind styling config
│       │
│       ├── index.html                 # Entry HTML
│       ├── src/
│       │   ├── main.jsx               # React entry point
│       │   ├── App.jsx                # Main app component
│       │   ├── App.css                # Global styles
│       │   │
│       │   ├── components/
│       │   │   ├── Navbar.jsx         # Top navigation
│       │   │   ├── AdminNavbar.jsx    # Admin navigation
│       │   │   ├── Sidebar.jsx        # (if exists)
│       │   │   ├── ProfileModal.jsx   # Profile display
│       │   │   ├── NotificationDropdown.jsx
│       │   │   ├── AdminNotificationDropdown.jsx
│       │   │   ├── UserNotificationDropDown.jsx
│       │   │   │
│       │   │   ├── pages/
│       │   │   │   ├── Landing.jsx    # Home page
│       │   │   │   ├── Login.jsx      # Login form
│       │   │   │   ├── Signup.jsx     # Registration form
│       │   │   │   ├── Dashboard.jsx  # Main dashboard
│       │   │   │   ├── Discovery.jsx  # Find study partners
│       │   │   │   ├── StudyMode.jsx  # Study interface
│       │   │   │   ├── Profile.jsx    # User profile
│       │   │   │   ├── ResetPassword.jsx
│       │   │   │   ├── LoadingPage.jsx
│       │   │   │   ├── NotFound.jsx   # 404 page
│       │   │   │   │
│       │   │   │   ├── admin/
│       │   │   │   │   └── AdminDashboard.jsx
│       │   │   │   │
│       │   │   │   └── ... (other pages)
│       │   │   │
│       │   │   └── ui/                # Reusable UI components
│       │   │       ├── button.jsx
│       │   │       ├── input.jsx
│       │   │       ├── label.jsx
│       │   │       ├── checkbox.jsx
│       │   │       ├── textarea.jsx
│       │   │       └── ...
│       │   │
│       │   ├── utils/
│       │   │   ├── api.js             # API client setup
│       │   │   ├── auth.js            # Auth helpers
│       │   │   ├── websocket.js       # WebSocket client
│       │   │   └── constants.js       # Constants
│       │   │
│       │   ├── assets/                # Images, icons
│       │   └── lib/                   # Utility libraries
│       │
│       └── public/                    # Static assets
│
├── .gitignore                         # Git ignore rules
├── .env                               # Root environment (if any)
├── README.md                          # This file
└── LICENSE                            # Project license
```

---

## Core Modules

### 1. **Authentication** (`authentication/`)
**Purpose**: User registration, login, and account security

**Key Models**:
- `User` - Custom user model with email-based auth
- `EmailVerification` - 6-digit email verification codes
- `PasswordReset` - Password recovery codes

**Endpoints**:
- `POST /api/auth/register/` - Create new account
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/verify-email/` - Verify email with code
- `POST /api/auth/check-email/` - Check if email is available
- `POST /api/auth/reset-password/` - Initiate password reset

**Features**:
- College domain validation (@islingtoncollege.edu.np)
- JWT token authentication
- Email verification before login
- Secure password hashing (bcrypt)
- Token refresh mechanism

---

### 2. **User Profile** (`user_profile/`)
**Purpose**: Manage user profiles, study goals, and activities

**Key Models**:
- `Profile` - User profile with bio, picture, initials
- `StudyGoal` - User learning goals with completion tracking
- `Activity` - Track user activities (login, post creation, etc.)

**Endpoints**:
- `GET/PUT /api/profiles/{id}/` - Profile CRUD
- `POST /api/study-goals/` - Create study goals
- `GET /api/activities/` - User activity history

**Features**:
- Auto-create profile on user registration
- Track study progress
- Activity logging
- Profile picture uploads

---

### 3. **Discovery** (`discovery/`)
**Purpose**: Smart algorithm to match students with compatible study partners

**Key Models**:
- `MatchScore` - Stores computed match scores between users

**Core Algorithm**:
```
Match Score = (0.40 × Interest Match) 
            + (0.30 × Course Match) 
            + (0.20 × Year Match) 
            + (0.10 × University Match)
```

**Matching Criteria**:
1. **Interests** (40%): Category-based interest matching
2. **Courses** (30%): String similarity + fuzzy matching (>80%)
3. **Year** (20%): Same year = 100%, Adjacent = 50%, >2yr diff = 0%
4. **University** (10%): All matches within institution = 100%

**Endpoints**:
- `GET /api/discovery/matches/` - Get matched students
- `GET /api/discovery/match-score/{user_id}/` - Get match details

**Features**:
- Real-time match computation
- Weighted scoring system
- Fuzzy course name matching
- Interest category mapping
- 24 comprehensive pytest tests

---

### 4. **Chat** (`chat/`)
**Purpose**: Real-time messaging and conversations

**Key Models**:
- `Conversation` - 1-to-1 messaging thread
- `Message` - Individual messages (with soft delete)
- `TypingIndicator` - Show typing status

**Endpoints**:
- `GET/POST /api/conversations/` - List/create conversations
- `GET /api/conversations/{id}/messages/` - Get messages
- `POST /api/conversations/{id}/messages/` - Send message
- **WebSocket** `/ws/chat/{conversation_id}/` - Real-time chat

**Features**:
- Real-time messaging via WebSocket
- Typing indicators
- Message read status
- Soft delete (privacy)
- Automatic participant sorting

---

### 5. **Connections** (`connection/`)
**Purpose**: User connection requests and following

**Key Models**:
- `ConnectionRequest` - Send/receive follow requests

**Endpoints**:
- `POST /api/connections/request/` - Send request
- `POST /api/connections/{id}/accept/` - Accept request
- `DELETE /api/connections/{id}/` - Remove connection

**Features**:
- Follow system
- Request acceptance/rejection
- Mutual connections

---

### 6. **Guild** (`guild/`)
**Purpose**: Study communities and event management

**Key Models**:
- `Guild` - Study community/organization
- `Event` - Events within guilds
- `EventParticipant` - Users attending events

**Endpoints**:
- `GET/POST /api/guilds/` - Guild CRUD
- `GET/POST /api/events/` - Event CRUD
- `POST /api/events/{id}/join/` - Join event

**Event Lifecycle**:
1. **Pending** - Event created, waiting for registrations
2. **Pre-Join** - Users pre-register (up to 2 people)
3. **Auto-Confirm** - When 3+ users join → Status = "Confirmed"
4. **Confirmed** - All participants auto-confirmed
5. **Event Ended** - Auto-detected based on date/time

**Features**:
- Community management
- Event creation & registration
- Auto-confirmation at 3 pre-joins
- Status transitions
- Attendee tracking
- Event categories

---

### 7. **Notifications** (`notification/`)
**Purpose**: Real-time notifications for users and admins

**Key Models**:
- `UserNotification` - Notifications for users
- `AdminNotification` - Alerts for administrators

**Notification Types**:
- Match found
- Message received
- Connection request
- Event confirmation
- Report submitted
- User suspension

**Features**:
- Real-time delivery via WebSocket
- Admin alerts
- User preferences (mute, mark read)

---

### 8. **Administration** (`administration/`)
**Purpose**: Admin tools for moderation and system management

**Key Models**:
- `UserReport` - User behavior reports
- `UserSuspension` - Suspend problematic users

**Endpoints**:
- `GET/POST /api/admin/reports/` - Manage reports
- `POST /api/admin/suspend/` - Suspend user
- `POST /api/admin/unsuspend/` - Lift suspension

**Features**:
- User suspension/unsuspension
- Report management
- Admin notifications
- Moderation workflow

---

## Frontend Pages & Navigation

### Public Pages (No Login Required)
| Page | Route | Purpose |
|------|-------|---------|
| **Landing** | `/` | Welcome & introduction |
| **Login** | `/login` | User sign-in |
| **Signup** | `/signup` | New user registration |
| **Not Found** | `/404` | 404 error page |

### Protected Pages (Login Required)
| Page | Route | Purpose |
|------|-------|---------|
| **Dashboard** | `/dashboard` | Main user hub |
| **Discovery** | `/discovery` | Find study partners |
| **Study Mode** | `/study` | Active chat/collaboration |
| **Profile** | `/profile` | View/edit user profile |
| **Guilds** | `/guilds` | Join study communities |
| **Events** | `/events` | Browse/create events |
| **Chat** | `/chat/:id` | Direct messaging |
| **Notifications** | `/notifications` | View all alerts |
| **Reset Password** | `/reset-password` | Password recovery |

### Admin Pages
| Page | Route | Purpose |
|------|-------|---------|
| **Admin Dashboard** | `/admin` | Admin control panel |
| **User Management** | `/admin/users` | Manage user accounts |
| **Report Management** | `/admin/reports` | Review user reports |
| **Event Approvals** | `/admin/events` | Approve/manage events |
| **System Monitoring** | `/admin/stats` | View system metrics |

### UI Components Used
- **Navbar**: Top navigation with user menu
- **AdminNavbar**: Admin-specific top navigation
- **ProfileModal**: User profile popup
- **NotificationDropdown**: User notifications
- **AdminNotificationDropdown**: Admin alerts
- **UserNotificationDropDown**: Alternative notification UI
- **Buttons, Inputs, Labels, Checkboxes**: Radix UI components
- **Styling**: Tailwind CSS for responsive design

---

## API Documentation

### Base URL
```
http://localhost:8000/api/
```

### Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Authentication (`/auth/`)
```
POST   /auth/register/                 - Register new user
POST   /auth/login/                    - Login user
POST   /auth/verify-email/             - Verify email
POST   /auth/check-email/              - Check email availability
POST   /auth/reset-password/           - Reset password
```

#### Profiles (`/profiles/`)
```
GET    /profiles/                      - List all profiles
GET    /profiles/{id}/                 - Get profile details
PUT    /profiles/{id}/                 - Update profile
```

#### Discovery (`/discovery/`)
```
GET    /discovery/matches/             - Get matching users
GET    /discovery/match-score/{id}/    - Get match details
```

#### Chat (`/conversations/`)
```
GET    /conversations/                 - List conversations
POST   /conversations/                 - Create conversation
GET    /conversations/{id}/messages/   - Get messages
POST   /conversations/{id}/messages/   - Send message
WS     /ws/chat/{conversation_id}/    - WebSocket chat
```

#### Guilds (`/guilds/`)
```
GET    /guilds/                        - List guilds
POST   /guilds/                        - Create guild
GET    /guilds/{id}/                   - Get guild details
```

#### Events (`/events/`)
```
GET    /events/                        - List events
POST   /events/                        - Create event
GET    /events/{id}/                   - Get event details
POST   /events/{id}/join/              - Join event
POST   /events/{id}/leave/             - Leave event
```

#### Connections (`/connections/`)
```
POST   /connections/request/           - Send request
POST   /connections/{id}/accept/       - Accept request
DELETE /connections/{id}/              - Remove connection
```

#### Notifications (`/notifications/`)
```
GET    /notifications/                 - Get notifications
POST   /notifications/{id}/read/       - Mark as read
```

#### Admin (`/admin/`)
```
GET    /admin/reports/                 - List reports
POST   /admin/reports/                 - File report
POST   /admin/suspend/                 - Suspend user
POST   /admin/unsuspend/               - Unsuspend user
```

---

## Database Models

### User & Auth
```
User (Custom)
├── email (unique, required)
├── password (hashed)
├── is_verified (boolean)
├── is_suspended (boolean)
├── is_active (boolean)
├── role (student/admin)
└── timestamps

EmailVerification
├── user (FK)
├── code (6-digit)
├── expires_at (datetime)
└── is_used (boolean)

PasswordReset
├── user (FK)
├── code
├── expires_at
└── is_used
```

### Profiles & Goals
```
Profile
├── user (OneToOne)
├── bio (text)
├── profile_picture (image)
├── full_name (string)
├── university (string)
├── study_year (integer)
└── timestamps

StudyGoal
├── user (FK)
├── title (string)
├── description (text)
├── completed (boolean)
└── timestamps

Activity
├── user (FK)
├── activity_type (string)
├── description (text)
└── timestamp
```

### Matching
```
MatchScore
├── user1 (FK)
├── user2 (FK)
├── score (decimal 0-100)
├── interest_score
├── course_score
├── year_score
└── updated_at
```

### Communication
```
Conversation
├── participant_one (FK User)
├── participant_two (FK User)
├── last_message (text)
└── updated_at

Message
├── conversation (FK)
├── sender (FK User)
├── content (text)
├── is_read (boolean)
├── is_deleted (boolean - soft delete)
└── created_at

TypingIndicator
├── conversation (FK)
├── user (FK)
└── timestamp
```

### Guilds & Events
```
Guild
├── guild_id (UUID)
├── name (string)
├── description (text)
├── member_count (integer)
└── timestamps

Event
├── event_id (UUID)
├── guild (FK)
├── title (string)
├── description (text)
├── category (choice: workshop/study_group/competition/networking/symposium)
├── date (DateField)
├── time_start (TimeField)
├── time_end (TimeField)
├── venue (string)
├── created_by (FK User)
├── status (choice: pending/confirmed/cancelled)
├── pre_joined_count (integer)
├── attendee_count (integer)
└── timestamps

EventParticipant
├── event (FK)
├── user (FK)
├── is_confirmed (boolean)
└── joined_at

EventPhoto
├── event (FK)
├── photo (image)
└── uploaded_at
```

### Connections
```
ConnectionRequest
├── from_user (FK User)
├── to_user (FK User)
├── status (choice: pending/accepted/rejected)
└── created_at
```

### Notifications
```
UserNotification
├── recipient (FK User)
├── notification_type (string: match/message/event/report)
├── title (string)
├── description (text)
├── is_read (boolean)
└── created_at

AdminNotification
├── notification_type (string)
├── title (string)
├── description (text)
└── created_at
```

### Reports & Moderation
```
UserReport
├── report_id (UUID)
├── reported_by (FK User)
├── reported_user (FK User)
├── reason (choice: spam/harassment/inappropriate/fake/scam/other)
├── details (text)
├── status (choice: pending/reviewed/dismissed/action_taken)
├── reviewed_by (FK User - nullable)
├── reviewed_at (datetime - nullable)
├── admin_notes (text)
└── timestamps

UserSuspension
├── suspension_id (UUID)
├── user (FK)
├── suspended_by (FK User)
├── reason (text)
├── duration_days (integer)
├── expires_at (datetime)
├── is_active (boolean)
└── timestamps
```

---

## User Guide

### Getting Started

#### 1. **Creating an Account**
   - Go to `/signup`
   - Enter college email (@islingtoncollege.edu.np)
   - Create strong password
   - Enter full name and university details
   - Click "Register"
   - Check email for 6-digit verification code
   - Enter code on verification page
   - ☑️ Account created!

#### 2. **Logging In**
   - Go to `/login`
   - Enter email and password
   - Click "Sign In"
   - ☑️ Redirected to dashboard

#### 3. **Complete Your Profile**
   - Click on Profile icon (top right)
   - Edit bio, upload profile picture
   - Add study year, interests, courses
   - Create study goals
   - ☑️ Profile ready!

---

### Finding Study Partners

#### 4. **Discovery Page**
   - Click "Discovery" in sidebar
   - View suggested matches based on algorithm
   - Each card shows:
     - User name & profile picture
     - Match score (0-100)
     - Common interests
     - Shared courses
   - Click to view full profile
   - Click "Connect" to send request

#### 5. **Connection Requests**
   - Sent requests appear in "Pending"
   - Received requests in "Requests"
   - Accept/Reject incoming requests
   - Once accepted → Can start chatting

---

### Messaging

#### 6. **Start a Conversation**
   - Go to Dashboard
   - Click "New Chat" or "Messages"
   - Select a user to message
   - Type your message
   - Press Enter to send
   - ☑️ Real-time chat!

#### 7. **Chat Features**
   - See when other user is **typing** (typing indicator)
   - **Read status** shows if message is read
   - **Delete messages** (soft delete - still private)
   - **Search conversations** by user name

---

### Study Communities (Guilds)

#### 8. **Browse & Join Guilds**
   - Click "Guilds" in sidebar
   - Browse available study communities
   - Click "Join Guild" on any community
   - ☑️ You're a member!

#### 9. **Create a Guild**
   - Click "Create Guild" button
   - Enter name, description, category
   - Add members
   - ☑️ Guild created!

---

### Events

#### 10. **Discover Events**
   - Click "Events" in navigation
   - Browse upcoming events
   - See event details:
     - Title, description, category
     - Date, time, venue
     - Number of attendees
     - Status (pending/confirmed/cancelled)

#### 11. **Join an Event**
   - Click on event card
   - Click "Pre-Join" button
   - **Tip**: Event auto-confirms when 3+ people pre-join!
   - Receive notification when confirmed
   - ☑️ You're attending!

#### 12. **Create an Event**
   - Click "Create Event"
   - Enter details:
     - Title & description
     - Category (workshop/study group/competition/networking/symposium)
     - Date & time
     - Venue/location
   - Click "Create"
   - Share with guild members
   - ☑️ Event created! (Status: Pending)

---

### Notifications

#### 13. **Stay Updated**
   - Notifications appear in top-right dropdown
   - Types of notifications:
     - New match found
     - New message
     - Connection request
     - Event updates
     - Admin alerts
   - Click to view details
   - Mark as read

---

### Troubleshooting During Use

| Issue | Solution |
|-------|----------|
| Can't login | Verify email is verified; reset password if needed |
| No chat messages | Ensure other user is online; refresh page |
| Event not showing up | Event might be expired (check date) |
| Notifications not updating | Check internet connection; reconnect WebSocket |
| Profile picture not uploading | Check file size (<5MB), format (jpg/png) |

---

## Testing

### Running Tests

#### Backend Tests (Django)
```bash
cd backend

# Run all tests
python3 manage.py test --parallel

# Run specific app tests
python3 manage.py test authentication -v 2
python3 manage.py test discovery
python3 manage.py test guild.tests

# Run with verbose output
python3 manage.py test -v 2
```

#### Discovery Algorithm Tests (pytest)
```bash
cd backend

# Run discovery tests (complex matching algorithm)
pytest discovery/tests/test_discovery.py -v

# Run specific test
pytest discovery/tests/test_discovery.py::TestMatchScoreCalculation -v
```

#### All Tests Summary
```bash
cd backend

# Run everything
python3 manage.py test --parallel
pytest discovery/tests/test_discovery.py

# Expected: 99 Django tests + 24 pytest tests = 123 total
```

### Test Coverage

| Module  | Type | Status |
|--------|------|--------|
| authentication | Django TestCase | ☑️ All Passing |
| user_profile | Django TestCase | ☑️ All Passing |
| connection | Django TestCase | ☑️ All Passing |
| chat | Django TestCase | ☑️ All Passing |
| notification | Django TestCase | ☑️ All Passing |
| guild | Django TestCase | ☑️ All Passing |
| administration  Django TestCase | ☑️ All Passing |
| discovery | pytest | ☑️ All Passing |
| **Total** | Mixed | **☑️ 100% Pass Rate** |

---

## Troubleshooting

### Common Issues & Solutions

#### Backend Issues

**Issue: "No module named 'studymatch_backend'"**
```bash
# Solution: Ensure you're in backend directory
cd backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
python3 manage.py runserver
```

**Issue: "django.core.exceptions.ImproperlyConfigured"**
```bash
# Solution: Check .env file exists and DEBUG is set
cat .env
# Should show: DEBUG=True
```

**Issue: Database "table does not exist"**
```bash
# Solution: Run migrations
python3 manage.py migrate

# If that fails:
python3 manage.py migrate --run-syncdb
```

**Issue: "Connection refused" (Redis)**
```bash
# Solution: Redis not running
# Install Redis:
brew install redis  # macOS
# or
apt install redis-server  # Linux

# Start Redis:
redis-server
```

#### Frontend Issues

**Issue: "Cannot GET /"**
```bash
# Solution: Frontend not running
cd frontend/studymatch_frontend
npm run dev
```

**Issue: "API request failed" or CORS error**
```bash
# Solution: Backend not running or wrong URL
# Check VITE_API_URL in frontend/.env
cat .env
# Should show: VITE_API_URL=http://localhost:8000/api/
```

**Issue: WebSocket not connecting**
```bash
# Solution: 
# 1. Check Redis is running: redis-server
# 2. Check backend has Django Channels installed: pip list | grep channels
# 3. Restart backend server
```

#### Authentication Issues

**Issue: "Email domain not allowed"**
```
Only @islingtoncollege.edu.np emails are accepted
(Admin can create other users manually)
```

**Issue: "Invalid verification code"**
```
- Code expires after 24 hours
- Code must be exactly 6 digits
- Can request new code via email
```

**Issue: "Token expired"**
```
- Frontend automatically refreshes token
- If manual: POST /api/auth/refresh/ with refresh token
```

---

## Contributing

### Setup Development Environment

```bash
# 1. Fork repository on GitHub

# 2. Clone your fork
git clone https://github.com/yourusername/StudyMatch.git
cd StudyMatch

# 3. Create feature branch
git checkout -b feature/your-feature-name

# 4. Make changes and test
python3 manage.py test  # Backend
npm run dev            # Frontend

# 5. Commit changes
git add .
git commit -m "Add description of changes"

# 6. Push to your fork
git push origin feature/your-feature-name

# 7. Create Pull Request on GitHub
```

### Code Style

- **Python**: PEP 8 (use `black` formatter)
- **JavaScript**: ESLint + Prettier
- **Comments**: Clear, concise documentation
- **Tests**: Write tests for new features

### Pull Request Guidelines

- ☑️ All tests pass
- ☑️ New features have tests
- ☑️ Code follows style guide
- ☑️ Documentation updated
- ☑️ Clear PR description

---

##  Support & Contact

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Use GitHub Discussions
- **Email**: study.matchh@gmail.com(if applicable)

---

## Acknowledgments

- **Django** & **Django REST Framework** communities
- **React** & **Vite** ecosystems
- **Islington College** for the platform use case
- All contributors who helped build this!

---

**Last Updated**: April 2025
**Version**: 1.0.0

---

##  Quick Start Commands Cheatsheet

```bash
# Setup
git clone https://github.com/yourusername/StudyMatch.git
cd StudyMatch/backend
source sm_env/bin/activate
pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py runserver

# In another terminal:
cd StudyMatch/frontend/studymatch_frontend
npm install
npm run dev

# Testing
cd StudyMatch/backend
python3 manage.py test --parallel
pytest discovery/tests/test_discovery.py -v

# Admin
python3 manage.py createsuperuser
# Visit: http://localhost:8000/admin/
```

---

**Happy Learning! 📚✨**
