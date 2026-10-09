# CareerReady AI — Backend

> **AI-Driven Placement Readiness Analytics System for Students**  
> Enterprise-grade Spring Boot 3 REST API Backend with Random Forest Machine Learning Readiness Engine, MCQ Assessment Engine, Dynamic Company Matching & Company-Specific Skill Gap Analysis.

---

## 🚀 Overview

The **CareerReady AI** backend powers the student placement preparation and analytics ecosystem. It is built strictly using **Java 17+**, **Spring Boot 3.x**, **Spring Data JPA**, **Hibernate**, **Spring Security (JWT + BCrypt)**, and **MySQL 8**.

### Core Architecture Flow
```
STUDENT
Login
  ↓
Aptitude MCQ Assessment (20 Questions, 20 Minutes)
  ↓
Submit Answers → Automatic Score & Percentage Calculation
  ↓
Technical MCQ Assessment (20 Questions, 20 Minutes)
  ↓
Submit Answers → Automatic Score & Percentage Calculation
  ↓
Student Academic + Programming + Skill Synthesis
  ↓
Random Forest Classifier Placement Readiness Prediction
  ↓
Readiness Score (0 - 100) & Classification (HIGHLY_READY | READY | NEEDS_IMPROVEMENT | AT_RISK)
  ↓
Company Recruitment Matching (Eligibility & Match %)
  ↓
Company-Specific Skill Gaps (Dynamically calculated per company)
```

---

## 🛠 Technology Stack

- **Java**: 17+ (tested with OpenJDK 17 and OpenJDK 24)
- **Framework**: Spring Boot 3.3.4
- **ORM / Persistence**: Spring Data JPA & Hibernate
- **Database**: MySQL 8.0+
- **Security**: Spring Security 6, Stateless JWT (JJWT 0.12.6), BCrypt Password Hashing
- **Build Tool**: Apache Maven 3.9+
- **Validation**: Jakarta Validation (`jakarta.validation-api`)
- **API Documentation**: SpringDoc OpenAPI 3.x / Swagger UI
- **Boilerplate Reduction**: Project Lombok

---

## 🗄️ MySQL Database Setup

### 1. Create the Database
Ensure your local or cloud MySQL 8 instance is running, then execute:

```sql
CREATE DATABASE IF NOT EXISTS career_ready_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 2. Environment Variables Configuration
Configure your database credentials in `src/main/resources/application.properties` or provide them via standard environment variables:

| Variable | Default Value | Description |
|---|---|---|
| `DB_HOST` | `localhost` | MySQL Host |
| `DB_PORT` | `3306` | MySQL Port |
| `DB_NAME` | `career_ready_db` | MySQL Database Name |
| `DB_USER` | `root` | MySQL Username |
| `DB_PASSWORD` | *(empty)* | MySQL Password |
| `JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | 256-bit HMAC secret |
| `JWT_EXPIRATION_MS` | `86400000` (24h) | JWT Token validity in milliseconds |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5174,http://localhost:3000` | Allowed origins |

> In development, `spring.jpa.hibernate.ddl-auto=update` is active, so all 14 tables and relationships will automatically be generated on first run.

---

## 🏃 How to Build and Run

### Run Unit and Integration Tests
```bash
mvn clean test
```

### Package the Application
```bash
mvn clean package -DskipTests=false
```

### Start the Spring Boot Backend Server
```bash
mvn spring-boot:run
```
The backend server starts on: **`http://localhost:8080`**

---

## 📖 Swagger / OpenAPI Documentation

Interactive OpenAPI 3.0 documentation with JWT Bearer Token authentication testing is available at:

- **Swagger UI**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **OpenAPI JSON**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

## 🔑 Demo Credentials

The backend automatically seeds 4 production-grade demo user accounts with BCrypt-hashed passwords (`password123`) on startup:

| Role | Email | Password | Name | Description |
|---|---|---|---|---|
| **STUDENT** | `student@careerready.ai` | `password123` | Arun Kumar | 4th Year CSE, CGPA 8.8, 23CSE001 |
| **PLACEMENT_STAFF** | `staff@careerready.ai` | `password123` | Dr. R. Sharma | Placement Staff (CSE Placement Cell) |
| **PLACEMENT_HOD** | `hod@careerready.ai` | `password123` | Prof. K. Venkatesh | Head of Career Development & Placements |
| **ADMIN** | `inbaasara@gmail.com` | `Inbaa@1234` | System Administrator | Institution Superuser |

*Additional pre-seeded student accounts for analytics testing:*
- `rahul@careerready.ai` (CGPA 5.9, 2 backlogs, Classified as **AT_RISK**)
- `priya@careerready.ai` (CGPA 9.4, Classified as **HIGHLY_READY**)

---

## 📡 API Reference Overview

### 1. Authentication (`/api/auth`)
- `POST /api/auth/login` — Login with email and password, receives JWT token
- `POST /api/auth/register/student` — Register a student with academic metrics and department

### 2. MCQ Assessment Engine (`/api/assessments`)
- `POST /api/assessments/start` — Start a 20-question Aptitude or Technical assessment (*Never returns correct answers*)
- `POST /api/assessments/{assessmentId}/submit` — Submit answers, calculates score & percentage, marks completed, triggers automatic readiness update
- `GET /api/assessments/{assessmentId}/result` — Get detailed assessment result and answer breakdown
- `GET /api/assessments/student/{studentId}` — Get student assessment history
- `GET /api/assessments/status` — Get aptitude & technical test status for logged-in student

### 3. Random Forest Placement Readiness (`/api/readiness`)
- `POST /api/readiness/predict` — Infer placement readiness using 50-tree Random Forest Ensemble
- `GET /api/readiness/student/{studentId}` — Get latest readiness prediction for a student
- `GET /api/readiness/me` — Get readiness prediction for authenticated student

### 4. Company Matching & Company-Specific Skill Gaps (`/api/companies`)
- `GET /api/companies/matches/student/{studentId}` — Dynamic company matching & eligibility
- `GET /api/companies/{companyId}/skill-gaps/student/{studentId}` — **Company-Specific Skill Gaps** (Calculated separately for every company)
- `GET /api/companies/matches/me` — Matches for current student
- `GET /api/companies/{companyId}/skill-gaps/me` — Skill gaps for current student
- `GET /api/companies` — List all active recruitment companies
- `GET /api/companies/{companyId}` — Get company details and required skills

### 5. Student Profile (`/api/students`)
- `GET /api/students/me` — Get complete student profile
- `PUT /api/students/me` — Update CGPA, scores, and profile
- `PUT /api/students/me/skills` — Update student skills inventory

### 6. Placement Staff Monitoring (`/api/staff`)
- `GET /api/staff/students` — Student monitoring with search, department, year, classification filters, and pagination
- `GET /api/staff/students/at-risk` — Students classified as `AT_RISK` with specific risk factors
- `GET /api/staff/analytics/readiness` — Institution readiness score distribution & averages
- `GET /api/staff/analytics/skill-gaps` — Most common skill gaps across recruitment drives
- `GET /api/staff/analytics/companies` — Company eligibility counts and skill gaps
*(Note: Staff Reports have been intentionally excluded per requirements)*

### 7. Placement HOD Analytics (`/api/hod`)
- `GET /api/hod/analytics` — Institution-level executive metrics
- `GET /api/hod/analytics/departments` — Department-wise readiness and at-risk breakdown
- `GET /api/hod/analytics/at-risk` — Department-wise at-risk counts and top skill gaps
- `GET /api/hod/analytics/companies` — Corporate recruitment drive analytics

### 8. Administration (`/api/admin`)
- `/api/admin/users` — CRUD for system users
- `/api/admin/students` — Student administration
- `/api/admin/staff` — Staff management
- `/api/admin/hod` — HOD management
- `/api/admin/departments` — Department management
- `/api/admin/companies` — Company management (configure required CGPA, skills, skill levels, cutoffs)
- `/api/admin/skills` — Skill repository management

---

## 🔗 Frontend Connection Instructions

The existing React/Vite frontend in `/frontend` connects to this backend at `http://localhost:8080/api`:

1. Start the MySQL database: `career_ready_db`
2. Start the Spring Boot backend: `cd backend && mvn spring-boot:run`
3. The frontend is configured to consume `http://localhost:8080/api` with automatic Bearer Token headers:
   ```javascript
   headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json'
   }
   ```
4. CORS is enabled for `http://localhost:5173` and `http://localhost:5174`.
