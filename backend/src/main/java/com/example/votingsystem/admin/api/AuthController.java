package com.example.votingsystem.admin.api;

import com.example.votingsystem.admin.domain.Role;
import com.example.votingsystem.admin.security.*;
import com.example.votingsystem.student.repo.StudentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
// Handles auth endpoints: /api/auth/login (issue JWT) and /api/auth/me
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authManager;  // Performs credential checks
    private final JwtService jwt;  // Issues JWT tokens
    private final LoginAttemptService attempts;  // Tracks/blocks student login attempts
    private final StudentRepository students;  // Detects if username is a student indexNo

    public AuthController(
            AuthenticationManager authManager,
            JwtService jwt,
            LoginAttemptService attempts,
            StudentRepository students
    ) {
        this.authManager = authManager;
        this.jwt = jwt;
        this.attempts = attempts;
        this.students = students;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", ""); // Read credentials from JSON
        String password = body.getOrDefault("password", "");

        // Only students can be blocked. Cheap pre-check by indexNo.(identified by indexNo)
        boolean isStudentUser =
                students.existsByIndexNo(username); // ← or existsByIndexNo(username)

        // If student is currently blocked → return 423 (Locked)
        if (isStudentUser && attempts.isBlocked(username)) {
            Optional<Instant> until = attempts.blockedUntil(username);
            return ResponseEntity.status(423).body(Map.of(
                    "error", "LOCKED",
                    "message", "Student temporarily blocked after 3 failed attempts. Try again later.",
                    "blockedUntil", until.orElse(null)
            ));
        }

        try {
            // Delegate authentication to Spring Security
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            // success → clear streak if student
            if (isStudentUser) attempts.recordSuccess(username);

            Object principal = auth.getPrincipal();
            String tokenUsername;
            Role role;

            if (principal instanceof UserDetailsImpl p) {
                tokenUsername = p.getUsername();
                role = p.role(); // ADMIN / ORGANIZER
            } else if (principal instanceof StudentDetailsImpl p) {
                tokenUsername = p.getUsername();
                role = Role.STUDENT; // Normalize students to STUDENT role
            } else {
                tokenUsername = auth.getName();
                role = Role.STUDENT;  // Safe default
            }

            // Create 12-hour JWT
            String token = jwt.generate(tokenUsername, role, 60L * 60L * 12L); // 12h

            // Return token payload to client
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", tokenUsername,
                    "role", role.name()
            ));
        } catch (BadCredentialsException ex) {
            // failed → count + maybe lock (students only)
            // Record failure and possibly lock student accounts
            if (isStudentUser) {
                attempts.recordFailure(username);
                if (attempts.isBlocked(username)) {
                    Optional<Instant> until = attempts.blockedUntil(username);
                    return ResponseEntity.status(423).body(Map.of(
                            "error", "LOCKED",
                            "message", "Student temporarily blocked after 3 failed attempts. Try again later.",
                            "blockedUntil", until.orElse(null)
                    ));
                }
            }
            // generic response (keeps admin UX unchanged)
            // Non-student or not yet locked → generic 401
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED",
                    "message", "Invalid username or password"
            ));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build(); // Not authenticated

        // Extract username + role from principal type
        Object principal = auth.getPrincipal();
        String username;
        String role;

        if (principal instanceof UserDetailsImpl p) {
            username = p.getUsername();
            role = p.role().name();
        } else if (principal instanceof StudentDetailsImpl p) {
            username = p.getUsername();
            role = Role.STUDENT.name();
        } else {
            username = auth.getName();
            role = Role.STUDENT.name();
        }

        // Return identity summary
        return ResponseEntity.ok(Map.of("username", username, "role", role));
    }
}
