# ==========================================
# Step 1: Build the React Frontend
# ==========================================
FROM node:18-alpine AS frontend-builder
ARG VITE_API_BASE="/"
ARG VITE_API_URL="/"
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ==========================================
# Step 2: Build the Spring Boot Backend
# ==========================================
FROM eclipse-temurin:17-jdk-alpine AS backend-builder
WORKDIR /app/backend

# Copy Maven wrapper and POM configuration
COPY backend/.mvn ./.mvn
COPY backend/mvnw backend/pom.xml ./

# Convert line endings of Maven wrapper (just in case they are CRLF from Windows)
RUN tr -d '\r' < mvnw > mvnw_unix && mv mvnw_unix mvnw && chmod +x mvnw

# Download dependencies in offline mode for caching
RUN ./mvnw dependency:go-offline

# Copy the backend source files
COPY backend/src ./src

# Copy the compiled React assets from Step 1 directly into the Spring Boot static folder
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static/

# Package the unified Spring Boot app as a executable JAR
RUN ./mvnw clean package -DskipTests

# ==========================================
# Step 3: Run the Application
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-builder /app/backend/target/*.jar app.jar

# Define port 8080 as default
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
