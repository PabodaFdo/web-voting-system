# 🔌 Bright Future Backend

Spring Boot handles the API layer for authentication, voting, nominee management, dashboards, notifications, and result reports.

## 🧠 Main Areas

- 🔐 Admin and student authentication with JWT security
- 🧑‍🎓 Student signup, approval, and voting
- 🏆 Event, category, and nominee management
- 📊 Dashboard and voting progress APIs
- ✉️ Email notification services
- 📄 Result publishing and exports
- 🗄 Local H2 database configuration

## 🚀 Run

From this folder:

```powershell
.\mvnw.cmd spring-boot:run
```

The API runs on `http://localhost:8080` by default.

## ✅ Test

```powershell
.\mvnw.cmd test
```

If your local H2 file is open in another process, run tests with an in-memory database:

```powershell
.\mvnw.cmd test "-Dspring.datasource.url=jdbc:h2:mem:votingsystem_test;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
```

## 🗄 Database

The default development database is H2:

```text
jdbc:h2:file:../data/testdb;DB_CLOSE_ON_EXIT=FALSE
```

The `../data` path is relative to this `backend/` folder. The H2 console is available at:

```text
http://localhost:8080/h2-console
```

Default local credentials:

- User: `sa`
- Password: `1234`

## ⚙️ Environment Variables

Use `.env.example` as a reference. Keep real secrets in environment variables or deployment settings, not in source files.

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend server port, default `8080` |
| `SPRING_DATASOURCE_URL` | Override the H2 or production database URL |
| `SPRING_DATASOURCE_USERNAME` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | Database password |
| `APP_JWT_SECRET` | JWT signing secret |
| `SPRING_MAIL_HOST` | SMTP host |
| `SPRING_MAIL_PORT` | SMTP port |
| `SPRING_MAIL_USERNAME` | SMTP username |
| `SPRING_MAIL_PASSWORD` | SMTP password |
| `APP_MAIL_FROM_ADDRESS` | Sender email address |
| `APP_MAIL_FROM_NAME` | Sender display name |

## 🗂 Source Layout

```text
src/main/java/com/example/votingsystem/
|-- admin/
|-- dashboard/
|-- notification/
|-- nominee/
|-- result/
|-- student/
`-- voting/
```
