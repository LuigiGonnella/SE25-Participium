# Participium - Citizen Issue Reporting Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

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

#### Technical Offices and Responsibilities

The municipality includes several technical offices, each responsible for a specific area of public infrastructure.  
When a report is approved, the system assigns it to the correct office automatically.

##### Offices Overview

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

Participium follows a **three-tier architecture**:

```
┌─────────────────┐
│    Frontend     │  React 19 + TypeScript + Vite
│   (Port 5173)   │  React Router, Leaflet Maps, Bootstrap Italia
└────────┬────────┘
         │ HTTP/REST
┌────────▼────────┐
│     Backend     │  Node.js 20 + Express 5 + TypeScript
│   (Port 8080)   │  TypeORM, Passport.js, Multer
└────────┬────────┘
         │ SQL
┌────────▼────────┐
│    Database     │  MySQL 8.0
│   (Port 3306)   │  Persistent Volume
└─────────────────┘
```

### Key Design Patterns
- **Repository Pattern**: Data access logic abstraction
- **DTO (Data Transfer Object)**: Clean separation between database entities and API responses
- **Service Layer**: Business logic encapsulation
- **Middleware Chain**: Authentication, error handling, and request processing
- **Custom Error Handling**: Centralized error management with specific error types

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

### 2. Environment Configuration (Optional)

The application uses default configuration values suitable for Docker Compose deployment. If you need to customize settings, you can create environment files:

**Backend** (`Backend/.env`):
```env
DB_TYPE=mysql
DB_HOST=mysql
DB_PORT=3306
DB_NAME=participium
DB_USERNAME=participium
DB_PASSWORD=participium
PORT=8080
```

**Frontend** (`Frontend/.env`):
```env
VITE_BACKEND_URL=http://localhost:8080/api/v1
VITE_STATIC_URL=http://localhost:8080
```

**Note:** The `docker-compose.yaml` file already contains these values as environment variables and build args, so creating `.env` files is optional.

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

#### 2. Access the Application

- **Frontend (Web UI)**: http://localhost:5173
- **Backend API**: http://localhost:8080/api/v1
- **Database**: localhost:3306 (accessible with credentials: `participium` / `participium`)

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

### Report Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/v1/reports` | Create new report | Yes | CITIZEN |
| GET | `/api/v1/reports/public` | Get map reports (non-pending/rejected) | Yes | CITIZEN |
| GET | `/api/v1/reports` | Get all reports with filters | Yes | STAFF |
| GET | `/api/v1/reports/:id` | Get report by ID | Yes | STAFF |
| PATCH | `/api/v1/reports/:id/manage` | Update report (assign/reject) | Yes | MPRO |
| PATCH | `/api/v1/reports/:id/work` | Update report (progress/resolve) | Yes | TOSM |

### Office Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/offices` | Get all offices | Yes |

---

## License

This project is developed for educational purposes as part of the Software Engineering 2 course at Politecnico di Torino.

See the 'LICENSE' file for more infromations.

---

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub: [Issues](https://github.com/LuigiGonnella/SE25-Participium/issues)
---
