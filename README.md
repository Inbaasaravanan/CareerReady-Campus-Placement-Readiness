# CareerReady AI — AI-Driven Placement Readiness Analytics System for Students

> **An enterprise AI-driven placement readiness prediction, MCQ assessment, and company recruitment matching platform.**

---

## 🏗️ Project Architecture & Repository Structure

```
Readiness 1/
│
├── frontend/               # React 18 + Vite Web Application
│   ├── src/
│   │   ├── components/     # UI components (Layout, Cards, Badges, Modals)
│   │   ├── pages/          # Student, Staff, HOD, and Admin dashboards & workflows
│   │   │   ├── student/    # /student/assessment (Aptitude & Technical MCQ, Result),
│   │   │   │               # /student/readiness, /student/company-matching, /student/dashboard
│   │   │   ├── staff/      # /staff/dashboard, /staff/students, /staff/at-risk,
│   │   │   │               # /staff/skill-gaps, /staff/company-matching
│   │   │   ├── hod/        # /hod/dashboard, /hod/departments, /hod/at-risk
│   │   │   └── admin/      # /admin/dashboard, users, companies, skills, departments
│   │   ├── services/       # Centralized API service layers (assessmentService, readinessService, etc.)
│   │   └── styles/         # Custom design system CSS
│   ├── package.json
│   └── vite.config.js
│
├── ml-service/              # Python Flask + scikit-learn ML Microservice (Port 5000)
│   ├── app.py              # Flask API (/health, /predict)
│   ├── requirements.txt    # Python dependencies (scikit-learn, Flask, pandas, numpy, joblib)
│   ├── data/
│   │   └── training_data.csv # Calibrated multi-attribute student placement training dataset
│   ├── model/
│   │   ├── train_model.py  # Model training & validation script (RandomForestClassifier)
│   │   ├── prediction.py   # Real-time inference engine
│   │   └── model.pkl       # Serialized trained Random Forest model artifact
│   └── README.md
│
├── backend/                # Spring Boot 3 + Java 17 + MySQL 8 REST API (Port 8080)
│   ├── pom.xml             # Maven build descriptor
│   ├── README.md           # Comprehensive Backend Documentation & API Reference
│   └── src/
│       ├── main/java/com/careerready/
│       │   ├── config/     # SecurityConfig, PythonMlConfig, CorsConfig, OpenApiConfig
│       │   ├── controller/ # Auth, Assessment, Readiness, Company, Student, Staff, HOD, Admin
│       │   ├── dto/        # Clean request & response DTOs across all modules
│       │   ├── entity/     # JPA Entities (User, Student, Question, Assessment, Company, etc.)
│       │   ├── enums/      # Role, AssessmentType, ReadinessClassification, SkillLevel, etc.)
│       │   ├── exception/  # GlobalExceptionHandler, MlServiceUnavailableException
│       │   ├── repository/ # Spring Data JPA repositories with custom analytics queries
│       │   ├── security/   # JWT Provider, Auth Filter, UserPrincipal, UserDetailsService
│       │   └── service/    # PythonMlService client, Company Matching, Assessments, etc.
│       └── resources/
│           └── application.properties # MySQL, JWT, ml.service.url, CORS, Swagger configs
│
└── README.md               # Root Project Documentation (this file)
```

---

## ⚡ Core Application Workflow

1. **Student Login & Authentication**: Secure JWT token generation with role-based authorization.
2. **Aptitude MCQ Assessment**: 20 randomized questions across Quantitative, Logical, and Verbal topics with a 20-minute timer.
3. **Automatic Score Calculation**: Immediate calculation of score and percentage upon submission (*correct answers are never exposed to students beforehand*).
4. **Technical MCQ Assessment**: 20 randomized questions across Java, Python, SQL, DBMS, DSA, Web Tech, and OS.
5. **Random Forest Readiness Prediction**: When both assessments are completed, the system automatically runs the 50-tree Random Forest Ensemble ML service to compute the student's **Readiness Score (0-100)** and **Classification** (`HIGHLY_READY`, `READY`, `NEEDS_IMPROVEMENT`, `AT_RISK`).
6. **Company Recruitment Matching**: Real-time evaluation of CGPA, skills, skill levels, and assessment cutoffs against top recruiting companies (TCS, Infosys, Accenture, Wipro, Cognizant, Cisco, Amazon, Capgemini).
7. **Company-Specific Skill Gaps**: Dynamically identifies precise skill gaps tailored uniquely to each company's individual hiring criteria.
8. **Institutional Monitoring**:
   - **Placement Staff**: Student filtering, monitoring, at-risk detection, readiness analytics, and skill gap distribution. *(Note: Staff reports intentionally excluded).*
   - **Placement HOD**: Executive institution analytics, department comparisons, at-risk summaries, and corporate recruitment readiness.
   - **Admin**: Full administrative CRUD for users, departments, companies, skills, and cutoffs.

---

## 🚀 Quick Start Guide

### 1. Database Setup (MySQL 8)
```sql
CREATE DATABASE IF NOT EXISTS career_ready_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 2. Start the Backend Server (Spring Boot 3)
```bash
cd backend
mvn spring-boot:run
```
- API Base URL: `http://localhost:8080/api`
- Interactive Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### 3. Start the Frontend Server (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Frontend UI URL: `http://localhost:5173` or `http://localhost:5174`
---

## 🔑 Demo Login Credentials

| Role | Email | Password | Name |
|---|---|---|---|
| **STUDENT** | `student@careerready.ai` | `password123` | Arun Kumar |
| **PLACEMENT_STAFF** | `staff@careerready.ai` | `password123` | Dr. R. Sharma |
| **PLACEMENT_HOD** | `hod@careerready.ai` | `password123` | Prof. K. Venkatesh |
| **ADMIN** | `inbaasara@gmail.com` | `Inbaa@1234` | System Administrator |

---

## 📄 Documentation
For detailed API specifications, architecture decisions, and database schemas, see backend and ml-service documentation.

