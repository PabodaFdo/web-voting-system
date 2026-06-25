package com.example.votingsystem.admin.auth;

import com.example.votingsystem.student.domain.Student;
import com.example.votingsystem.student.repo.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

// Service: handles password reset via OTP (generate, email, verify, update password)
@Service
@RequiredArgsConstructor
public class PasswordResetService {
    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final StudentRepository students; // Access to student accounts
    private final PasswordResetRepository resets; // Access to reset-code records
    private final JavaMailSender mailSender; // Sends the OTP email
    private final PasswordEncoder encoder; // Hashes the new password

    // Make a 6-digit random OTP as a zero-padded string
    private static String randomOtp() {
        return String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
    }

    // Find student by email or index number (case-insensitive)
    private Optional<Student> findByIdentifier(String identifier) {
        if (identifier == null) return Optional.empty();
        return students.findByEmailIgnoreCase(identifier)
                .or(() -> students.findByIndexNoIgnoreCase(identifier));
    }

    /** Create & send OTP; also log to IntelliJ console. */
    @Transactional
    public void requestOtp(String identifier) {
        var student = findByIdentifier(identifier).orElse(null); // avoid enumeration (If not found, stop)
        if (student == null) return;

        // Create a new reset record with OTP and 10-minute expiry
        var pr = new PasswordReset();
        pr.setStudent(student);
        pr.setCode(randomOtp());
        pr.setExpiresAt(Instant.now().plus(Duration.ofMinutes(10)));
        resets.save(pr);

        // Log OTP for dev/testing
        log.info("Password reset OTP for {} [{}] is: {}", student.getEmail(), student.getIndexNo(), pr.getCode());

        // Try to email the OTP to the student
        try {
            var msg = new SimpleMailMessage();
            msg.setTo(student.getEmail());
            msg.setSubject("Your password reset code");
            msg.setText("""
                    Hello %s,

                    Your password reset code is: %s
                    This code will expire in 10 minutes.

                    — Bright Future
                    """.formatted(
                    student.getFullName() != null ? student.getFullName() : "Student",
                    pr.getCode()
            ));
            mailSender.send(msg);
        } catch (Exception e) {
            // Email failure is logged but does not crash the flow
            log.warn("Failed to send password reset email: {}", e.getMessage());
        }
    }

    /** Verify OTP and set new password. */
    @Transactional
    public void resetPassword(String identifier, String otp, String newPassword) {
        // Must be a real account
        var student = findByIdentifier(identifier)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        // Get latest unused reset request
        var latest = resets.findTopByStudentIdAndUsedAtIsNullOrderByIdDesc(student.getId())
                .orElseThrow(() -> new IllegalArgumentException("No active reset request"));

        // Validate expiry and code
        if (latest.isExpired()) throw new IllegalArgumentException("Code expired");
        if (!latest.getCode().equals(otp)) throw new IllegalArgumentException("Invalid code");

        // Update password (hashed) and save
        student.setPasswordHash(encoder.encode(newPassword));
        students.save(student);

        // Mark OTP as used
        latest.setUsedAt(Instant.now());
        resets.save(latest);
    }
}
