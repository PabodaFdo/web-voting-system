package com.example.votingsystem.admin.auth;

import com.example.votingsystem.student.domain.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

// Stores password reset codes (OTP) for students
@Entity             // JPA entity
@Table(name = "password_reset")   // DB table name
@Getter
@Setter
public class PasswordReset {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;   // Auto-increment ID

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Student student;  // The student who asked for the reset (loaded only when needed)

    @Column(nullable = false, length = 16)
    private String code;      // 6-digit OTP (dev: plain)

    @Column(nullable = false)
    private Instant expiresAt; // Time after which the code won't work

    private Instant usedAt;  // Time when the code was used (null = not used)

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now(); // When this record was created

    @Transient public boolean isExpired() { return Instant.now().isAfter(expiresAt); } // Is it past expiry?
    @Transient public boolean isUsed()    { return usedAt != null; } // Has it been used?
}
