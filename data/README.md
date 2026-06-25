# 🗄 Local Data

This folder is used by the local H2 development database.

The backend defaults to:

```text
jdbc:h2:file:../data/testdb;DB_CLOSE_ON_EXIT=FALSE
```

## 📦 Contents

The local `testdb.*` files contain development data such as users, votes, nominees, events, and results. These files are ignored by Git.

## ♻️ Resetting The Database

Stop the backend, remove the local `testdb.*` files, and start the backend again. Spring Boot will create a fresh local database on the next run.
