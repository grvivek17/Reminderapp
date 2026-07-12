# Smart Reminder App - Documentation

A task and reminder app organized by day of the week with AI-powered daily briefings, geolocation-based alerts, and native Android support via Capacitor.

**Repository:** https://github.com/grvivek17/Reminderapp
**Live Server:** http://140.245.215.103:8080

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Tech Stack](#tech-stack)
4. [Backend API](#backend-api)
5. [Frontend](#frontend)
6. [Database Schema](#database-schema)
7. [AI Features](#ai-features)
8. [Geolocation & Notifications](#geolocation--notifications)
9. [Docker & Deployment](#docker--deployment)
10. [Android APK Build](#android-apk-build)
11. [Environment Variables](#environment-variables)
12. [External Integrations](#external-integrations)
13. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
+------------------+       +------------------+       +-------------------+
|   Android APK    |       |   Web Browser    |       |    PWA (Mobile)   |
|  (Capacitor)     |       |                  |       |                   |
+--------+---------+       +--------+---------+       +---------+---------+
         |                          |                           |
         |   WebView loads from     |   Direct HTTP             |
         +--------+-----------------+---------------------------+
                  |
                  v
     +------------+-------------+
     |     Nginx (Port 80)      |
     |  - Serves index.html     |
     |  - Proxies /api/ to 3001 |
     |  - Caching rules         |
     +------------+-------------+
                  |
                  v
     +------------+-------------+
     |   Express Backend (3001) |
     |  - /api/auth             |
     |  - /api/tasks            |
     |  - /api/ai               |
     +---+--------+--------+---+
         |        |        |
         v        v        v
    Oracle DB  HuggingFace  External APIs
    (Cloud)    (Llama 3.3)  (Weather/Holiday)
```

**Key points:**
- Single-page app (SPA) served by Nginx
- Capacitor APK loads the same SPA from the server URL via WebView
- Nginx reverse-proxies `/api/*` requests to the Express backend
- Backend connects to Oracle Cloud DB via wallet authentication

---

## Project Structure

```
Reminderapp/
├── index.html              # Main SPA (all HTML/CSS/JS in one file, ~4900 lines)
├── package.json            # Frontend Capacitor dependencies
├── capacitor.config.json   # Capacitor mobile configuration
├── Dockerfile              # Frontend Nginx container
├── docker-compose.yml      # Container orchestration
├── nginx.conf              # Nginx reverse proxy config
├── manifest.json           # PWA manifest
├── service-worker.js       # PWA offline caching
├── privacy-policy.html     # Play Store privacy policy
├── .gitignore
├── .dockerignore
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── store-assets/           # Play Store screenshots & graphics
├── www/                    # Capacitor web directory (copy of index.html)
├── android/                # Capacitor Android project
│   └── app/src/main/
│       └── AndroidManifest.xml
└── backend/
    ├── server.js           # Express entry point (port 3001)
    ├── db.js               # Oracle DB connection pool
    ├── package.json        # Backend dependencies
    ├── Dockerfile          # Backend Node container
    ├── .env                # Environment variables (secrets)
    ├── .dockerignore
    ├── middleware/
    │   └── auth.js         # JWT authentication middleware
    └── routes/
        ├── auth.js         # Signup, login, user management
        ├── tasks.js        # Task CRUD operations
        └── ai.js           # AI briefing, grouping, location inference
```

---

## Tech Stack

| Layer       | Technology                                     |
|-------------|------------------------------------------------|
| Frontend    | Vanilla HTML/CSS/JS (single `index.html` SPA)  |
| Backend     | Express 5.x on Node.js 20                      |
| Database    | Oracle Cloud Autonomous DB (wallet auth)        |
| AI          | HuggingFace API with Meta Llama 3.3 70B        |
| Mobile      | Capacitor 8.x (Android)                        |
| Web Server  | Nginx Alpine                                   |
| Containers  | Docker + Docker Compose                        |
| Auth        | JWT (jsonwebtoken) + bcryptjs                  |

### Frontend Dependencies (Capacitor plugins)
- `@capacitor/core` - Core runtime
- `@capacitor/android` - Android platform
- `@capacitor/geolocation` - GPS access
- `@capacitor/local-notifications` - Task reminders
- `@capacitor-community/background-geolocation` - Background location tracking

### Backend Dependencies
- `express` - HTTP framework
- `oracledb` - Oracle DB driver
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing
- `cors` - Cross-origin support
- `dotenv` - Environment variable loading

---

## Backend API

**Base URL:** `/api` (proxied by Nginx to `http://backend:3001`)

All authenticated endpoints require `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`)

| Method | Endpoint          | Auth | Description                          |
|--------|-------------------|------|--------------------------------------|
| POST   | `/api/auth/signup` | No   | Create account (name, email, password) |
| POST   | `/api/auth/login`  | No   | Login, returns JWT token             |
| GET    | `/api/auth/me`     | Yes  | Get current user profile             |
| DELETE | `/api/auth/users/:id` | Yes | Delete a user (cannot delete self)  |

| Method | Endpoint       | Auth | Description                     |
|--------|----------------|------|---------------------------------|
| GET    | `/api/users`   | Yes  | List all users (for task assignment) |

**Signup request:**
```json
{ "name": "John", "email": "john@example.com", "password": "secret123" }
```

**Login/Signup response:**
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "name": "John", "email": "john@example.com", "color": "#4f6ef7", "createdAt": "2025-01-01T00:00:00Z" }
}
```

### Tasks (`/api/tasks`)

| Method | Endpoint                | Auth | Description                        |
|--------|-------------------------|------|------------------------------------|
| GET    | `/api/tasks`            | Yes  | List all tasks (own + assigned)    |
| POST   | `/api/tasks`            | Yes  | Create new task                    |
| PUT    | `/api/tasks/:id`        | Yes  | Update task (owner or assignee)    |
| DELETE | `/api/tasks/:id`        | Yes  | Delete task (owner only)           |
| PUT    | `/api/tasks/:id/status` | Yes  | Quick status toggle                |
| POST   | `/api/tasks/:id/assign` | Yes  | Update task assignments            |

**Task object:**
```json
{
  "id": 1,
  "text": "Buy groceries",
  "date": "2025-07-04",
  "priority": "high",          // high | medium | low
  "category": "personal",      // personal | professional
  "status": "not_started",     // not_started | in_progress | on_hold | completed
  "createdBy": 1,
  "locationText": "Supermarket",
  "locationLat": 12.9716,
  "locationLng": 77.5946,
  "assignedTo": [1, 2],
  "createdAt": "2025-07-04T10:00:00Z",
  "updatedAt": "2025-07-04T10:00:00Z"
}
```

### AI (`/api/ai`)

| Method | Endpoint                | Auth | Description                         |
|--------|-------------------------|------|-------------------------------------|
| POST   | `/api/ai/daily-briefing`| Yes  | Generate AI-powered daily briefing  |
| POST   | `/api/ai/group-themes`  | Yes  | Group tasks by AI-detected themes   |
| POST   | `/api/ai/infer-location`| Yes  | Infer location from task text       |

**Daily briefing response:**
```json
{
  "summary": "You have 5 tasks today...",
  "workPlan": [
    { "task": "Team standup", "why": "Recurring meeting", "timeHint": "Morning" }
  ],
  "alerts": ["3 overdue tasks need attention"],
  "recommendations": ["Consider batching errands together"]
}
```

### Health Check

| Method | Endpoint    | Description      |
|--------|-------------|------------------|
| GET    | `/healthz`  | Returns `OK`     |

---

## Frontend

The entire frontend lives in a single `index.html` file (~4900 lines) containing all HTML, CSS, and JavaScript.

### Key Functions

| Function                      | Purpose                                    |
|-------------------------------|--------------------------------------------|
| `api(path, options)`          | Generic API client with JWT auth           |
| `loadAppData()`               | Load tasks and users from backend          |
| `initAuth()`                  | Initialize authentication state            |
| `handleAuth(e)`               | Process login/signup forms                 |
| `handleSubmit(e)`             | Create or update a task                    |
| `cycleStatus(id)`             | Cycle task status (click to advance)       |
| `fetchThemeGroups()`          | AI-grouped task themes                     |
| `initBriefing()`              | Initialize Smart Briefing panel            |
| `fetchDailyBriefing()`        | Call AI briefing endpoint                  |
| `fetchWeather(retryCount)`    | Get weather via IP geolocation             |
| `fetchHolidayInfo(dateStr)`   | Check Indian public holidays               |
| `suggestLocation()`           | AI-infer location from task text           |
| `initNativeLocation()`        | Initialize Capacitor geolocation           |
| `pinCurrentLocation()`        | Capture GPS coords for a task              |
| `startBackgroundLocation()`   | Start background geofence tracking         |
| `checkNearbyTasks()`          | Alert if user is near a task's location    |
| `scheduleTaskNotifications()` | Schedule native reminder notifications     |
| `renderBriefingHtml()`        | Render Smart Briefing with marquee animations |
| `getCapPlugin(name)`          | Get Capacitor native plugin (replaces esm.sh imports) |

### Views

1. **Week View** - Tasks organized by day (Mon-Sun), default view
2. **Calendar View** - Month calendar with task indicators per day
3. **All Tasks View** - Filterable list with search, status/priority/category filters
4. **Progress View** - Completion statistics and trends

### Smart Briefing Panel

The briefing panel appears at the top of the app and shows:
- **Summary** - AI-generated overview of the day (scrolls with marquee if >60 chars)
- **Work Plan** - Prioritized tasks with time hints (Morning/Afternoon/Evening)
- **Alerts** - Overdue tasks, weather warnings
- **Recommendations** - AI suggestions for productivity

### CSS Color Scheme

| Variable          | Color     | Usage                    |
|-------------------|-----------|--------------------------|
| Primary accent    | `#4f6ef7` | Buttons, links           |
| Danger            | `#ef4444` | Delete, high priority    |
| Priority High     | `#ef4444` | Red badge                |
| Priority Medium   | `#f59e0b` | Amber badge              |
| Priority Low      | `#22c55e` | Green badge              |
| Personal category | `#8b5cf6` | Purple indicator         |
| Professional      | `#0ea5e9` | Sky blue indicator       |

---

## Database Schema

Oracle Cloud Autonomous Database with wallet-based authentication.

### Tables (inferred from code)

**`reminder_users`**
| Column       | Type         | Notes                        |
|--------------|--------------|------------------------------|
| id           | NUMBER       | Primary key (auto-increment) |
| name         | VARCHAR2     | Display name                 |
| email        | VARCHAR2     | Unique, used for login       |
| password     | VARCHAR2     | bcrypt hash                  |
| color        | VARCHAR2     | Random avatar color (hex)    |
| created_at   | TIMESTAMP    | Account creation time        |

**`reminder_tasks`**
| Column        | Type         | Notes                              |
|---------------|--------------|------------------------------------|
| id            | NUMBER       | Primary key (auto-increment)       |
| text          | VARCHAR2     | Task description                   |
| date          | DATE         | Scheduled date                     |
| priority      | VARCHAR2     | high / medium / low                |
| category      | VARCHAR2     | personal / professional            |
| status        | VARCHAR2     | not_started / in_progress / on_hold / completed |
| created_by    | NUMBER       | FK to reminder_users               |
| location_text | VARCHAR2     | Human-readable location name       |
| location_lat  | NUMBER       | GPS latitude                       |
| location_lng  | NUMBER       | GPS longitude                      |
| created_at    | TIMESTAMP    | Task creation time                 |
| updated_at    | TIMESTAMP    | Last update time                   |

**`reminder_task_assignments`**
| Column     | Type   | Notes                    |
|------------|--------|--------------------------|
| task_id    | NUMBER | FK to reminder_tasks     |
| user_id    | NUMBER | FK to reminder_users     |

---

## AI Features

**Provider:** HuggingFace Inference API
**Model:** Meta Llama 3.3 70B Instruct (via SambaNova router)

### Daily Briefing
- Sends today's tasks, overdue tasks, weather, holiday info, completion stats
- AI returns a structured JSON with summary, work plan, alerts, recommendations
- Summary line uses marquee/running text animation if >60 characters

### Theme Grouping
- Sends all visible tasks to AI
- Returns groups like "Health & Fitness", "Work Meetings", etc.
- Each group contains task IDs for frontend organization

### Location Inference
- When creating a task, AI analyzes the task text
- Suggests a location (e.g., "Buy groceries" -> "Supermarket")
- User can accept or dismiss the suggestion

---

## Geolocation & Notifications

### Capacitor Plugin Access

All native plugins are accessed via `getCapPlugin(name)` which uses `Capacitor.registerPlugin()` -- the native bridge injected into the WebView. This replaced earlier `esm.sh` imports that were not connected to native plugins.

### Location Features

| Feature                | Plugin                                         |
|------------------------|-------------------------------------------------|
| Current GPS position   | `@capacitor/geolocation`                       |
| Background tracking    | `@capacitor-community/background-geolocation`  |
| Geofence alerts        | Background plugin + Haversine distance calc     |
| Location pinning       | Current GPS -> task's lat/lng fields            |

- **Geofence radius:** defined by `GEOFENCE_RADIUS_M` constant
- **Distance calc:** Haversine formula for accuracy
- **Background mode:** Runs as Android foreground service with notification

### Notification Features

| Feature                | Plugin                         |
|------------------------|--------------------------------|
| Task reminders         | `@capacitor/local-notifications` |
| Location-based alerts  | Background geolocation + local notifications |
| Exact alarm scheduling | Android `SCHEDULE_EXACT_ALARM` permission |

### Android Permissions

```
INTERNET, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION,
ACCESS_BACKGROUND_LOCATION, FOREGROUND_SERVICE,
FOREGROUND_SERVICE_LOCATION, POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM
```

---

## Docker & Deployment

### Local Development (docker-compose)

```bash
# Build and start both containers
docker-compose up --build -d

# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

`docker-compose.yml` runs two services:
- **frontend** - Nginx on port 3000, proxies `/api/` to `backend:3001`
- **backend** - Express on port 3001, uses `.env` for secrets

### Production Server Deployment

The server runs on Oracle Cloud (IP: `140.245.215.103`, port `8080`).

**Deployment steps:**
```bash
# 1. Copy files to server
scp index.html nginx.conf antigravity:/home/ubuntu/Reminderapp/

# 2. SSH into server and fix proxy_pass for non-compose setup
#    Change: proxy_pass http://backend:3001
#    To:     proxy_pass http://172.17.0.1:3001
sed -i 's|proxy_pass http://backend:3001|proxy_pass http://172.17.0.1:3001|g' nginx.conf

# 3. Rebuild and restart frontend container
docker stop reminder-frontend && docker rm reminder-frontend
docker build -t reminder-frontend .
docker run -d --name reminder-frontend -p 8080:80 reminder-frontend

# Backend runs separately (not in compose on production)
```

**Important:** On the server, Nginx uses `http://172.17.0.1:3001` (Docker bridge IP) instead of `http://backend:3001` (compose service name) because containers are run individually, not via docker-compose.

### Nginx Caching Strategy

| Resource          | Cache Policy                          |
|-------------------|---------------------------------------|
| `index.html`      | No cache (`no-store, must-revalidate`) |
| `service-worker.js` | No cache                            |
| Static assets     | 1 year (`public, immutable`)          |
| `manifest.json`   | 1 hour                                |
| SPA fallback `/`  | No cache                              |

---

## Android APK Build

### Prerequisites
- **JDK 21** (Microsoft OpenJDK 21.0.11 or similar)
- **Gradle 8.14+** (bundled with project)
- **Capacitor CLI** (`npx cap`)

### Build Steps

```bash
# 1. Ensure www/index.html is up-to-date
cp index.html www/index.html

# 2. Sync Capacitor
npx cap sync android

# 3. Set JAVA_HOME and build release APK
cd android
JAVA_HOME="/c/Program Files/Microsoft/jdk-21.0.11.10-hotspot" ./gradlew assembleRelease

# 4. APK output location
# android/app/build/outputs/apk/release/app-release.apk
```

### Capacitor Config

```json
{
  "appId": "com.grvivek.reminders",
  "appName": "Smart Reminder",
  "webDir": "www",
  "server": {
    "url": "http://140.245.215.103:8080",
    "cleartext": true
  }
}
```

The APK loads the SPA from the remote server URL. The `www/` directory serves as a fallback. `cleartext: true` is required since the server uses HTTP (not HTTPS).

---

## Environment Variables

**File:** `backend/.env`

| Variable           | Description                          | Example                              |
|--------------------|--------------------------------------|--------------------------------------|
| `ORACLE_USER`      | Oracle DB username                   | `ADMIN`                              |
| `ORACLE_PASSWORD`  | Oracle DB password                   | *(secret)*                           |
| `ORACLE_DSN`       | Oracle connection string             | `dbname_high`                        |
| `ORACLE_WALLET_DIR`| Path to Oracle wallet directory      | `/path/to/Wallet_DIR`                |
| `JWT_SECRET`       | Secret for signing JWT tokens        | *(secret)*                           |
| `PORT`             | Backend server port                  | `3001`                               |
| `AI_GATEWAY_URL`   | HuggingFace inference endpoint       | `https://router.huggingface.co/...`  |
| `AI_MODEL`         | LLM model name                       | `Meta-Llama-3.3-70B-Instruct`       |
| `HUGGINGFACE_TOKEN`| HuggingFace API token                | *(secret)*                           |

---

## External Integrations

| Service          | URL                                                        | Purpose                  |
|------------------|------------------------------------------------------------|--------------------------|
| IP Geolocation   | `https://ipapi.co/json/`                                   | Get user's city/country for weather |
| Weather          | Open-Meteo (via ipapi coordinates)                         | Weather data for briefing |
| Indian Holidays  | `https://date.nager.at/api/v3/PublicHolidays/{year}/IN`    | Holiday detection        |
| AI Inference     | `https://router.huggingface.co/sambanova/v1/chat/completions` | LLM for briefing/grouping |
| Database         | Oracle Cloud Autonomous DB                                 | Persistent storage       |

---

## Troubleshooting

### Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| APK shows stale content | `www/index.html` outdated or browser cache | Copy latest `index.html` to `www/`, rebuild APK |
| Geolocation not working in APK | Plugins loaded via `esm.sh` instead of native bridge | Use `getCapPlugin()` helper (already fixed) |
| Server shows old page after deploy | Nginx caching `index.html` | Already fixed with `no-cache` headers; force refresh with `docker stop/rm/build/run` |
| API returns 502 Bad Gateway | Backend container not running or wrong proxy_pass | Check backend is running on port 3001; on server use `172.17.0.1` not `backend` |
| Oracle DB connection fails | Wallet path incorrect or missing | Verify `ORACLE_WALLET_DIR` points to valid wallet directory |
| AI briefing fails | HuggingFace token expired or rate limited | Check `HUGGINGFACE_TOKEN` in `.env`; verify at huggingface.co |
| APK build fails | Wrong JDK version | Use JDK 21 (set `JAVA_HOME` before gradle) |

### Useful Commands

```bash
# Check server health
curl http://140.245.215.103:8080/healthz

# Check backend logs (on server)
docker logs reminder-backend

# Check frontend logs (on server)
docker logs reminder-frontend

# Rebuild APK (Windows/Git Bash)
cp index.html www/index.html && npx cap sync android
cd android && JAVA_HOME="/c/Program Files/Microsoft/jdk-21.0.11.10-hotspot" ./gradlew assembleRelease
```

---

*Last updated: July 4, 2026*
