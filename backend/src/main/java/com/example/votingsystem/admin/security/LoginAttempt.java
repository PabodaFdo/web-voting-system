package com.example.votingsystem.admin.security;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
@Table(name = "login_attempts", indexes = {
        @Index(name = "ix_login_attempts_username", columnList = "username", unique = true)
})
public class LoginAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // store student index in lower-case
    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(nullable = false)
    private int failures = 0;

    // when not blocked → null
    private Instant blockedUntil;

}
