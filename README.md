<p align="center">
  <img src="./docs/logo.svg" alt="Bright Future logo" width="720" />
</p>

# Web-based Voting System for Award Nominations
**Group:** 2025-Y2-S1-MLB-B8G1-02

## 🚀 Overview
A secure, web-based e-voting platform for campus award nominations. Final-year students vote once per category, admins manage events/categories/nominees, and organizers publish results with transparent reports and dashboards.

## 🎯 Core Goals
- Online voting with **one vote per category per student**
- Admin tools to **create categories**, **manage nominees**, **monitor progress**
- **Results generation** with exports and public publishing
- **Access control** with password management and reset flows

## 👥 Stakeholders / Users
- Final-Year Students (Voters)
- Admin Staff
- Event Organizers / Supervisors
- IT Support
- Public viewers (nominees & winners only)

## 🧩 Major Modules (RACI by owner)
- **Voting Management** – IT24101873 (Jesmeen M.B.A)
- **Award Categories & Nominee Management** – IT24101829 (Ranasinghe R.P.V.K.)
- **Notification & Email Reminder System** – IT24101927 (Liyanage J.L.K.L.)
- **Voting Progress Dashboard** – IT24103815 (Fernando W.P.S.)
- **Results & Report Management** – IT24101972 (Nethsara K.P.S.)
- **Access Control & Password Management** – IT24101952 (Senevirathna U.K.J.)

## ✅ Key Features
- Secure login (students/admins), role-based access, password reset
- Admin CRUD for categories & nominees (with validation)
- One-vote-per-category enforcement, review before submit
- Live dashboard (category/nominee progress, KPIs)
- Result computation, tie handling, CSV/PDF exports, public results page
- Email reminders (before close) and result notifications

## 🏗️ Architecture (Typical Monorepo)
```text
/backend/         # Spring Boot (Java 17, Maven, H2 for dev/test)
/frontend/        # React (Vite) SPA
```
**Tech stack:** Java 17, Spring Boot, Spring Data JPA, H2 (dev), MySQL (prod-ready), React (Vite), JavaMail, BCrypt, JWT.

## 🗃️ Data Model (high-level)
- **User**(id, username/email, role[STUDENT, ADMIN, ORGANIZER, IT_COORDINATOR], passwordHash, status)
- **Event**(id, name, startAt, endAt, status)
- **Category**(id, eventId, name, status)
- **Nominee**(id, categoryId, name, bio, photoUrl, status)
- **Vote**(id, voterId, categoryId, nomineeId, createdAt) — unique(voterId, categoryId)
- **Notification**(id, subject, body, scheduledFor, status, archived)  

## 🔐 Security
- BCrypt password hashing
- Role-based authorization (Student/Admin/Organizer)
- Session management (JWT) and account lockout on repeated failures
- Password reset via email token

## 📈 Non-Functional Requirements
- Mobile-friendly, accessible UI
- Target ≤2s response for typical actions; scale to hundreds of concurrent voters
- 99% uptime during voting windows; regular backups
- HTTPS in deployment; audit logs for admin actions

## ⚙️ Getting Started

### Prerequisites
- Java 17, Maven 3.9+
- Node.js 18+ and npm
- IDEs: IntelliJ IDEA (backend), VS Code/WebStorm (frontend)

### 1) Backend (Spring Boot + H2)
```bash
cd backend
.\mvnw.cmd spring-boot:run
```

**Default dev config (H2) via `application.yml`:**
```yaml
spring:
  datasource:
    url: jdbc:h2:file:../data/testdb;DB_CLOSE_ON_EXIT=FALSE
    username: sa
    password: 1234
  jpa:
    hibernate:
      ddl-auto: update
  h2:
    console:
      enabled: true
```

### 2) Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

### 3) Login & Roles (seed)
- The database is automatically seeded upon startup with default data.
- **Admin**: `admin` / `123`
- **Student**: `STU001` / `pass123` (or generic `student` / `123`)

## 🧪 Sample API (illustrative)
- `POST /api/auth/login` – authenticate user
- `GET /api/categories` – list categories (+ nominees)
- `POST /api/votes/submit` – submit all category votes (one-shot)
- `GET /api/dashboard` – admin KPIs & charts
- `POST /api/results/generate` – compute winners & export
- `POST /api/notifications/send` – send reminders/results  

## 📤 Reports & Publishing
- Admin can **generate results**, **review**, **export CSV/PDF**, and **publish** to a public page after voting closes.  
- Tie rules and freeze flags recommended.

## 🔔 Notifications
- Compose reminders; **schedule** (e.g., T-48h, T-24h) or **send now**  
- Store send logs; add retry/backoff in production.

## 📊 Dashboard
- Live progress (total votes, turnout, per-category counts)
- Lightweight polling (e.g., 10s) or SSE/WebSocket upgrade later
- Optional CSV/PDF export of progress snapshots

## 🧭 Project Management (Semester Flow)
- **Week 3:** Proposal & requirements
- **Weeks 4–6:** Design (ERD, use cases, UI)
- **Weeks 7–11:** Implementation (≥75% by Week 10)
- **Weeks 12–13:** Testing & optimization
- **Week 14:** Final demo + report submission

## 👪 Team & Responsibilities
- Jesmeen (IT24101873): Voting Management
- Ranasinghe (IT24101829): Categories & Nominees
- Liyanage (IT24101927): Notifications
- Fernando (IT24103815): Dashboard
- Nethsara (IT24101972): Results & Reports
- Senevirathna (IT24101952): Access Control & Passwords

## 🧭 How to Demo
1. Login as **Admin** (`admin`/`123`), create categories & nominees  
2. Create a **Student** account (or use seeded `STU001`) and login  
3. Cast votes (one per category) → submit → confirmation  
4. As **Admin**, open **Dashboard** (live counts)  
5. Close voting → **Generate results** → export CSV/PDF → **Publish** public page  
6. Send **result emails** to voters
