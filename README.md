# Participium - Citizen Issue Reporting Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg)](https://www.mysql.com/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-0088CC.svg)](https://t.me/ParticipiumBot)

**Participium** is a modern web-based platform designed to facilitate citizen engagement with municipal services. The application enables residents to report urban issues (such as broken streetlights, potholes, garbage collection problems, etc.) directly to the appropriate municipal offices through an intuitive map-based interface.

Developed as part of the Software Engineering 2 course at **Politecnico di Torino**, this project demonstrates full-stack development practices, RESTful API design, and containerized deployment strategies.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Default Users](#default-users)
- [License](#license)
- [Support](#support)


---

## Features

### For Citizens
- **Interactive Map Interface**: View and create reports on an interactive map of Turin with geospatial boundaries
- **Report Clustering**: Automatic clustering of nearby reports for better visualization at different zoom levels
- **Real-time Report Creation**: Submit reports with photos (up to 3), location, and detailed descriptions
- **Report Tracking**: Monitor the status of submitted reports (Pending, Assigned, In Progress, Resolved, Rejected)
- **Anonymous Reporting**: Option to submit reports anonymously
- **Notification System**: Receive notifications when report status changes
- **Message System**: Receive and send messages on reports in order to chat with the municipality staff

### For Municipal Staff
- **Role-Based Access Control**: Different permissions for Municipal Public Relations Officers (MPRO) and Technical Office Staff Members (TOSM)
- **Report Management Dashboard**: Filter and view reports by category, status, date range, and assigned staff
- **Report Assignment**: MPRO can assign reports to appropriate technical offices
- **Status Updates**: TOSM can update report status, add comments, and mark reports as resolved
- **Office-Based Filtering**: TOSM users see only reports relevant to their office category
- **Message System**: Receive and send messages on reports in order to chat with the citizens

### Offices Overview

The municipality includes several technical offices, each responsible for a specific area of public infrastructure.  
When a report is approved, the system assigns it to the correct office automatically.

| Technical Office | Category | Description |
| ---------------- | -------- | ----------- |
| Municipal Organization Office | Municipal Organization | Administrative or general municipal matters |
| Water Supply Office | Water Supply | Water leaks, hydrants, public fountains |
| Architectural Barriers Office | Architectural Barriers | Accessibility issues, ramps, physical barriers |
| Sewer System Office | Sewer System | Drainage problems, blocked or damaged sewers |
| Public Lighting Office | Public Lighting | Broken streetlights, malfunctioning electrical poles |
| Waste Office | Waste | Overflowing bins, street waste issues |
| Road Signs and Traffic Lights Office | Road Signs and Traffic Lights | Missing or damaged signs, malfunctioning traffic lights |
| Roads and Urban Furnishings Office | Roads and Urban Furnishings | Potholes, damaged pavements, issues with urban furniture |
| Public Green Areas and Playgrounds Office | Public Green Areas and Playgrounds | Park maintenance, playground equipment issues |

### System Features
- **Secure Authentication**: Session-based authentication with Passport.js
- **Image Upload & Storage**: Multer-based file handling with validation (JPEG, JPG, PNG)
- **Data Validation**: Comprehensive input validation on both client and server
- **Error Handling**: Centralized error handling with custom error types
- **Responsive Design**: Mobile-first responsive UI using Bootstrap Italia
- **Database Persistence**: MySQL database with TypeORM for data management

---

## Architecture

Participium follows a **multi-client architecture**, allowing interaction through both a web interface and a Telegram bot:

```
┌─────────────────┐                           ┌─────────────────┐
│  Telegram Bot   │  Node.js + TypeScript     │    Frontend     │  React 19 + Typescript + Vite
│   (Container)   │  Interacts with APIs      │   (Port 5173)   │  React Router, Leaflet Maps, Bootstrap Italia
└────────┬────────┘                           └────────┬────────┘
         │ HTTP/REST                                   │ HTTP/REST
         │                                             │
         └──────────────┐                 ┌────────────┘
                        │                 │
                 ┌──────▼─────────────────▼──────┐
                 │          Backend              │  Node.js 20 + Express 5
                 │        (Port 8080)            │  TypeScript, TypeORM
                 └──────────────┬────────────────┘  Passport.js, Multer
                                │ SQL
                         ┌──────▼────────┐
                         │    Database   │  MySQL 8.0
                         │  (Port 3306)  │  Persistent Volume
                         └───────────────┘
```

### Key Design Patterns
- **Repository Pattern**: Data access logic abstraction
- **DTO (Data Transfer Object)**: Clean separation between database entities and API responses
- **Service Layer**: Business logic encapsulation
- **Middleware Chain**: Authentication, error handling, and request processing
- **Custom Error Handling**: Centralized error management with specific error types
- **Bot-as-a-Client**: The Telegram Bot functions as a separate client that consumes the same Backend APIs as the web frontend, authenticated via a secure bearer token.

---

## Tech Stack

### Frontend
- **React 19.1** - UI library with latest features
- **TypeScript 5.9** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router 7.9** - Client-side routing
- **React Leaflet** - Interactive maps with OpenStreetMap
- **Supercluster** - Efficient geospatial clustering
- **Bootstrap Italia** - Italian public administration design system
- **Design React Kit** - React components for Bootstrap Italia

### Backend
- **Node.js 20** - Runtime environment
- **Express 5.1** - Web framework
- **TypeScript 5.9** - Type-safe server development
- **TypeORM 0.3.27** - Object-Relational Mapper
- **Passport 0.7** - Authentication middleware
- **Multer 1.4** - File upload handling
- **bcrypt 6.0** - Password hashing
- **Winston 3.17** - Logging framework
- **Jest 30.2** - Testing framework

### Telegram Bot
- **Node.js 20** - Runtime environment
- **TypeScript 5.9** - Type-safe development
- **node-telegram-bot-api** - Telegram Bot API wrapper
- **Bearer Authentication** - Secure bot-to-backend communication

### Database
- **MySQL 8.0** - Relational database
- **TypeORM Migrations** - Database schema versioning

### DevOps
- **Docker & Docker Compose** - Containerization and orchestration
- **Multi-stage Builds** - Optimized Docker images
- **Health Checks** - Service dependency management

---

## Prerequisites

Before running Participium, ensure you have the following installed:

- **Docker Desktop** (version 20.10 or higher)
  - Download: https://www.docker.com/products/docker-desktop
  - Includes Docker Compose automatically
- **Git** (for cloning the repository)
  - Download: https://git-scm.com/downloads

**Optional** (for local development without Docker):
- Node.js 20.x or higher
- npm 10.x or higher
- MySQL 8.0

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/LuigiGonnella/SE25-Participium.git
cd SE25-Participium
```

### 2. Environment Configuration

#### Docker Compose (Production/Root)
To run the full application stack using Docker Compose, you **must create a `.env` file** in the project root directory. This is required to configure external services like Email and Telegram.

**Root `.env` content:**

```env
RESEND_API_KEY=your_resend_api_key_here
BOT_BEARER="your_secure_bearer_token_here"
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

- `RESEND_API_KEY`: API key for Resend email service (used for email verification)
- `BOT_BEARER`: Bearer token used by the Telegram bot for backend authorization security
- `BOT_TOKEN`: The API key (token) for the Telegram bot, obtained from BotFather.

**Note**: _Make sure to keep these values secure and do not expose them publicly._

### 3. (Optional) Local Development Environment Variables
If you want to run the Backend, Frontend or Telegram bot services individually (without Docker), you need to create `.env` files in their respective directories.
#### Backend `.env` (in `Backend/` directory)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=participium
DB_PASSWORD=participium
DB_NAME=participium_db
SESSION_SECRET=your_session_secret_here
RESEND_API_KEY=your_resend_api_key_here
TELEGRAM_BOT_BEARER=your_secure_bearer_token_here
```
#### Frontend `.env` (in `Frontend/` directory)

```env
VITE_BACKEND_URL=http://localhost:8080
```
#### Telegram Bot `.env` (in `Telegram/` directory)

```env
BOT_BEARER="your_secure_bearer_token_here"
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

---

## Running the Application

### Using Docker Compose (Recommended)

Docker Compose will automatically build and start all services (MySQL, Backend, Frontend) with proper networking and health checks.

#### 1. Start the Application

From the project root directory:

```bash
docker-compose up --build
```

**What happens:**
1. **MySQL container** starts and initializes the database
2. **Backend container** waits for MySQL to be healthy, then:
   - Installs dependencies (`npm install`)
   - Compiles TypeScript (`npm run build`)
   - Starts the server (`npm run start`)
3. **Frontend container** waits for Backend to start, then:
   - Installs dependencies (`npm install`)
   - Starts the Vite dev server (`npm run dev`)
4. **Telegram Bot container** starts and connects to the Backend API, then:
   - Installs dependencies (`npm install`)
   - Starts the bot (`npm run start`)

#### 2. Access the Application

- **Frontend (Web UI)**: http://localhost:5173
- **Backend API**: http://localhost:8080/api/v1
- **Database**: localhost:3306 (accessible with credentials: `participium` / `participium`)
- **Telegram Bot**: Search for `@ParticipiumBot` on Telegram or use the link: https://t.me/ParticipiumBot

#### 3. Stop the Application

```bash
# Stop containers (preserves database data)
docker-compose down

# Stop containers and remove database volume (fresh start)
docker-compose down -v
```

#### 4. View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

#### 5. Rebuild After Code Changes

```bash
# Rebuild with cache
docker-compose up --build

# Rebuild without cache (clean build)
docker-compose build --no-cache
docker-compose up
```

---

## Testing

### Backend Tests

The backend includes comprehensive unit and E2E tests using Jest and Supertest.

```bash
cd Backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- reportRepository.db.test.ts

# Run in watch mode
npm test -- --watch
```

**Test Suites:**
- **Unit Tests**: Repository, Controller, Service layer tests
- **E2E Tests**: HTTP endpoint integration tests
- **Database Tests**: In-memory SQLite for isolated testing

### Frontend Tests

Manual E2E UI testing documentation is available in `Frontend/test/e2e/ui-manual-testing.md`.

---

## Project Structure

```
SE25-Participium/
├── Backend/
│   ├── src/
│   │   ├── config/           # Configuration files (database, passport)
│   │   ├── controllers/      # Request handlers
│   │   ├── database/         # Database connection setup
│   │   ├── middlewares/      # Express middlewares (auth, error)
│   │   ├── models/
│   │   │   ├── dao/          # TypeORM entities
│   │   │   ├── dto/          # Data Transfer Objects
│   │   │   └── errors/       # Custom error classes
│   │   ├── repositories/     # Data access layer
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic layer
│   │   └── uploads/          # User-uploaded files
│   ├── test/
│   │   ├── e2e/              # End-to-end tests
│   │   ├── unit/             # Unit tests
│   │   └── setup/            # Test configuration
│   ├── Dockerfile            # Backend container definition
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend/
│   ├── src/
│   │   ├── API/              # API client layer
│   │   ├── assets/           # Static assets
│   │   ├── components/       # React components
│   │   ├── models/           # TypeScript interfaces
│   │   └── services/         # Frontend services (error handling, etc.)
│   ├── test/
│   │   └── e2e/              # Manual E2E testing documentation
│   ├── Dockerfile            # Frontend container definition
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── Telegram/
│   ├── data/                 # Data used by the bot
│   ├── API.ts                # Backend API client for the Telegram bot
│   ├── index.ts              # Telegram bot entry point
│   ├── models.ts             # Shared models and types
│   ├── .env                  # Telegram bot environment variables
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
|
├── docker-compose.yaml       # Docker Compose orchestration
└── README.md                 # This file
```

---

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new citizen | No |
| POST | `/api/v1/auth/register-municipality` | Register new staff member | No |
| POST | `/api/v1/auth/login?type=CITIZEN` | Login as citizen | No |
| POST | `/api/v1/auth/login?type=STAFF` | Login as staff | No |
| GET | `/api/v1/auth/me` | Get current user info | Yes |
| DELETE | `/api/v1/auth/logout` | Logout | Yes |
| POST | `/api/v1/auth/createTelegramVerification` | Create Telegram verification code | Yes |
| POST | `/api/v1/auth/verifyTelegramUser` |  Verify Telegram user via Telegram bot | Bot auth |
| POST | `/api/v1/auth/verify-email` | Verify email using code | No |
| POST | `/api/v1/auth/resend-verification-email` | Resend verification email | Yes |

### Citizen Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/citizens` | Get all citizens | No |
| GET | `/api/v1/citizens/id/:id` | Get citizen by ID | No |
| GET | `/api/v1/citizens/email/:email` | Get citizen by email | No |
| GET | `/api/v1/citizens/username/:username` | Get citizen by username | No |
| PATCH | `/api/v1/citizens/:username` | Update citizen profile (supports profile picture upload) | Yes |
| GET | `/api/v1/citizens/telegram/:username` | Get citizen by Telegram username (called by Telegram bot) | Bot auth |

### Report Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/v1/reports` | Create new report | Yes | CITIZEN |
| GET | `/api/v1/reports/public` | Get map reports (accessible to authenticated and unauthenticated users) | No | - |
| GET | `/api/v1/reports` | Get all reports with filters | Yes | STAFF |
| GET | `/api/v1/reports/:reportId` | Get report by ID | Yes | STAFF |
| PATCH | `/api/v1/reports/:reportId/manage` | Update report (assign/reject) | Yes | MPRO |
| PATCH | `/api/v1/reports/:reportId/assignSelf` | Self-assign report | Yes | TOSM |
| PATCH | `/api/v1/reports/:reportId/assignExternal` | Assign report to external maintainer (EM) | Yes | TOSM |
| PATCH | `/api/v1/reports/:reportId/updateStatus` | Update report status (progress/resolve/suspend, etc.) | Yes | TOSM, EM |
| POST | `/api/v1/reports/:reportId/messages` | Add a message to report (public/private) | Yes | CITIZEN, STAFF |
| GET | `/api/v1/reports/:reportId/messages` | Get messages of a report (filtered by user type) | Yes | CITIZEN, STAFF |
| POST | `/api/v1/reports/telegram` | Create report from Telegram bot (multipart form-data) | Bot auth | — |
| GET | `/api/v1/reports/telegram/citizen/:telegram_username` | Get reports by Telegram username | Bot auth | — |
| GET | `/api/v1/reports/telegram/report/:reportId` | Get report details (Telegram bot) | Bot auth | — |

### Notification Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/v1/notifications` | Get notifications of current user | Yes | CITIZEN, STAFF |
| PATCH | `/api/v1/notifications/:id/read` | Mark notification as read | Yes | CITIZEN, STAFF |

### Office Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/v1/offices` | Get all offices | Yes | ADMIN |

### Staff Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/v1/staffs` | Get all staff members | Yes | ADMIN |
| GET | `/api/v1/staffs/tosm` | Get all TOSM staff | Yes | ADMIN |
| GET | `/api/v1/staffs/external` | Get external maintainers | Yes | TOSM |
| PATCH | `/api/v1/staffs/:username/offices` | Update offices of a staff member | Yes | ADMIN |

---

**Authentication legend:**
- `No` → Public endpoint
- `Yes` → Requires authenticated user session
- `Bot auth` → Accessible only by the Telegram bot via dedicated authentication. Requires a static bearer token (`TELEGRAM_BOT_BEARER`) sent via `Authorization: Bearer <token>`

### Telegram Verification Flow

1. The citizen sets their Telegram username in the profile page
2. The backend generates a verification code
3. The citizen sends `/verify <code>` to the Telegram bot
4. The bot validates the code using bot-authenticated endpoints
5. The Telegram account is marked as verified

---

## Default Users

For testing purposes, the application comes with pre-defined default users. These users are created automatically when the database is initialized.

### Citizens
| Username |   Name   | Surname | Password | Email                | Email notifications |
| -------- |-------- | ------- | -------- | -------------------- | ------------------- |
| cit_1    | Default1 | Citizen | cit123   | example1@example.com | false               |
| cit_2    | Default2 | Citizen | cit123   | example2@example.com | false               |
| cit_3    | Default3 | Citizen | cit123   | example3@example.com | false               |

### Internal Offices
| Name                                      | Category | Description                                                                       |
| ----------------------------------------- | -------- | :-------------------------------------------------------------------------------- |
| Municipal Organization Office             | MOO      | Office responsible for municipal administration and management                    |
| Water Supply Office                       | WSO      | Technical office responsible for water supply and management                      |
| Architectural Barriers Office             | ABO      | Technical office responsible for removing architectural barriers in public spaces |
| Sewer System Office                       | SSO      | Technical office responsible for sewer system maintenance and management          |
| Public Lighting Office                    | PLO      | Technical office responsible for public lighting infrastructure                   |
| Waste Office                              | WO       | Technical office responsible for waste management and street cleaning             |
| Road Signs and Traffic Lights Office      | RSTLO    | Technical office responsible for road signs and traffic lights maintenance        |
| Roads and Urban Furnishings Office        | RUFO    | Technical office responsible for road maintenance and urban furnishings           |
| Public Green Areas and Playgrounds Office | PGAPO     | Technical office responsible for public green areas and playgrounds               |

### External Offices
| Name                                      | Category | Description                                                                       |
| ----------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| External Company - Municipal Organization Office             | MOO      | Office responsible for municipal administration and management                    |
| External Company - Water Supply Office                       | WSO      | Technical office responsible for water supply and management                      |
| External Company - Architectural Barriers Office             | ABO      | Technical office responsible for removing architectural barriers in public spaces |
| External Company - Sewer System Office                       | SSO      | Technical office responsible for sewer system maintenance and management          |
| External Company - Public Lighting Office                    | PLO      | Technical office responsible for public lighting infrastructure                   |
| External Company - Waste Office                              | WO       | Technical office responsible for waste management and street cleaning             |
| External Company - Road Signs and Traffic Lights Office      | RSTLO    | Technical office responsible for road signs and traffic lights maintenance        |
| External Company - Roads and Urban Furnishings Office        | RUFO    | Technical office responsible for road maintenance and urban furnishings           |
| External Company - Public Green Areas and Playgrounds Office | PGAPO     | Technical office responsible for public green areas and playgrounds               |

### Staff Members
| Username | Name | Surname | Password | Role | Office |
| -------- | ---- | ------- | -------- | ---- | ---------------- |
| admin | Default | Admin |  admin123 | Admin | - |
| mpro | Default | MPRO | mpro123 | Municipal Public Relations Officer | Municipal Public Relations Office |
| tosm_WSO | Default | TOSM WSO | tosm123 | Technical Office Staff Member | Water Supply Office |
| tosm_ABO | Default | TOSM ABO | tosm123 | Technical Office Staff Member | Architectural Barriers Office |
| tosm_SSO | Default | TOSM SSO | tosm123 | Technical Office Staff Member | Sewer System Office |
| tosm_PLO | Default | TOSM PLO | tosm123 | Technical Office Staff Member | Public Lighting Office |
| tosm_WO | Default | TOSM WO | tosm123 | Technical Office Staff Member | Waste Office |
| tosm_RSTLO | Default | TOSM RSTLO | tosm123 | Technical Office Staff Member | Road Signs and Traffic Lights Office |
| tosm_RUFO | Default | TOSM RUFO | tosm123 | Technical Office Staff Member | Roads and Urban Furnishings Office |
| tosm_PGAPO | Default | TOSM PGAPO | tosm123 | Technical Office Staff Member | Public Green Areas and Playgrounds Office |

### External Maintainers
| Username | Name    | Surname  | Password | Office                           |
| -------- | ------- | -------- | -------- | ----------------------------------------- |
| em_WSO   | Default | EM WSO   | em123    | External Company - Water Supply Office                       |
| em_ABO   | Default | EM ABO   | em123    | External Company - Architectural Barriers Office             |
| em_SSO   | Default | EM SSO   | em123    | External Company - Sewer System Office                       |
| em_PLO   | Default | EM PLO   | em123    | External Company - Public Lighting Office                    |
| em_WO   | Default | EM WO   | em123    | External Company - Waste Office                              |
| em_RSTLO | Default | EM RSTLO | em123    | External Company - Road Signs and Traffic Lights Office      |
| em_RUFO  | Default | EM RUFO  | em123    | External Company - Roads and Urban Furnishings Office        |
| em_PGAPO | Default | EM PGAPO | em123    | External Company - Public Green Areas and Playgrounds Office |

---

## License

This project is developed for educational purposes as part of the Software Engineering 2 course at Politecnico di Torino.

See the 'LICENSE' file for more informations.

---

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub: [Issues](https://github.com/LuigiGonnella/SE25-Participium/issues)
---
