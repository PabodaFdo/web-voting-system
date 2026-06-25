# 🌐 Bright Future Frontend

React/Vite powers the student, public, and admin screens for the Bright Future voting platform.

## 🧩 Modules

The old separate frontend apps now live inside one Vite app:

```text
src/modules/
|-- admin/           Login, public pages, students, IT tools
|-- dashboard/       Voting progress dashboard
|-- nominee/         Events, categories, and nominees
|-- notifications/   Email compose, history, and archives
|-- results/         Result publishing, analytics, and exports
`-- voting/          Student voting flow and vote history
```

## 🚀 Run

From this folder:

```powershell
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

## ✅ Build And Lint

```powershell
npm run lint
npm run build
```

## ⚙️ Environment

Copy `.env.example` to `.env` if local defaults need to change.

```text
VITE_API_BASE=http://localhost:8080
VITE_API_URL=http://localhost:8080
VITE_PUBLIC_HOME=/
VITE_ADMIN_DASHBOARD_URL=/admin
VITE_VOTING_URL=http://localhost:5173
VITE_VOTES_PATH=/api/vote
VITE_REVIEW_BEFORE_SUBMIT=0
```

## 🧭 Main Routes

| Route | Screen |
| --- | --- |
| `/` | Public landing page |
| `/events` | Public event list |
| `/e/:eventId` | Public event detail |
| `/login` | Login and student signup |
| `/voting` | Student voting portal |
| `/my-vote` | Student vote dashboard |
| `/admin` | Admin dashboard |
| `/admin/students` | Student approval and management |
| `/admin/nominees` | Event, category, and nominee management |
| `/admin/notifications` | Notification center |
| `/admin/dashboard` | Voting progress dashboard |
| `/admin/results` | Results and reports |
| `/admin/results/analytics` | Analytics and exports |
| `/itc` | IT coordinator backup and restore |

## 🧼 Local Files

Keep local frontend files out of Git: `node_modules/`, `.env`, and `dist/`.
