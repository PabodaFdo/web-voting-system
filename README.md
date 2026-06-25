<p align="center">
  <img src="./docs/logo.svg" alt="Bright Future logo" width="720" />
</p>

<h1 align="center">Bright Future</h1>

<p align="center">
  🎓 A full-stack student awards voting platform with events, nominees, dashboards, notifications, and results.
</p>

<p align="center">
  <strong>Spring Boot API</strong> · <strong>React/Vite UI</strong> · <strong>H2 Local DB</strong>
</p>

## ✨ Overview

Bright Future lets students register, sign in, and vote in active campus award events. Admin users can manage events, categories, nominees, students, notifications, dashboards, and published result reports from one connected web app.

The project is organized as one Spring Boot backend and one React/Vite frontend, so the modules are easier to run, test, and maintain.

## 🗂 Project Layout

```text
.
|-- backend/        Spring Boot API, security, database, reports, and mail
|-- frontend/       React/Vite app with all UI modules
|-- data/           Local H2 database files for development
|-- docs/           Logo and README assets
`-- README.md
```

## 🧰 Requirements

- Java 17
- Node.js 18 or newer
- npm

## 🚀 Run Locally

Start the backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Local URLs:

| App | URL |
| --- | --- |
| 🌐 Frontend | `http://localhost:5173` |
| 🔌 Backend API | `http://localhost:8080` |
| 🗄 H2 console | `http://localhost:8080/h2-console` |

## ✅ Checks

Backend:

```powershell
cd backend
.\mvnw.cmd test
```

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

## ⚙️ Environment

Backend configuration lives in `backend/src/main/resources/application.yml`. Use `backend/.env.example` as a reference for local or deployment environment variables.

Use `frontend/.env.example` as the reference for frontend configuration.

Common backend variables:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_JWT_SECRET`
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`
- `APP_MAIL_FROM_ADDRESS`
- `APP_MAIL_FROM_NAME`

## 🧼 Repo Hygiene

Build output, dependencies, secrets, and local data should stay out of Git. That includes `node_modules/`, `target/`, `frontend/dist/`, and H2 database files under `data/`.

The repo includes:

- `.gitignore` for build output, local databases, editor files, and secrets
- `.editorconfig` for editor formatting defaults
- `.gitattributes` for consistent line endings, including Maven wrapper scripts
