package com.example.votingsystem.admin.security;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

// Tracks login failures and temporarily blocks users after too many tries
@Service
public class LoginAttemptService {

    private final LoginAttemptRepository repo;

    // Settings: how many failures before block, and block time
    private final int MAX_FAILURES = 3;
    private final Duration BLOCK_FOR = Duration.ofMinutes(10);

    public LoginAttemptService(LoginAttemptRepository repo) {
        this.repo = repo;
    }

    // Normalize username (trim + lowercase) for consistent lookups
    private String norm(String username) {
        return (username == null ? "" : username.trim().toLowerCase());
    }

    // Check if a user is currently blocked; if block expired, clear it
    public boolean isBlocked(String username) {
        String u = norm(username);
        return repo.findByUsername(u)
                .map(la -> {
                    Instant until = la.getBlockedUntil();
                    if (until == null) return false;  // never blocked
                    if (until.isAfter(Instant.now())) return true;  // still blocked
                    // block expired -> clear
                    la.setBlockedUntil(null);
                    la.setFailures(0);
                    repo.save(la);
                    return false;
                }).orElse(false);
    }

    // Get the time until which user is blocked (if any)
    public Optional<Instant> blockedUntil(String username) {
        return repo.findByUsername(norm(username)).map(LoginAttempt::getBlockedUntil);
    }

    // Record a failed login; if limit reached, start a block
    @Transactional
    public void recordFailure(String username) {
        String u = norm(username);
        LoginAttempt la = repo.findByUsername(u).orElseGet(() -> {
            LoginAttempt x = new LoginAttempt();  // create new counter if not exists
            x.setUsername(u);
            return x;
        });
        la.setFailures(la.getFailures() + 1); // increase failure count
        if (la.getFailures() >= MAX_FAILURES) {  // hit limit → block
            la.setFailures(0);   // reset counter
            la.setBlockedUntil(Instant.now().plus(BLOCK_FOR));
        }
        repo.save(la);
    }

    // Record a successful login; clear failures and any block
    @Transactional
    public void recordSuccess(String username) {
        repo.findByUsername(norm(username)).ifPresent(la -> {
            la.setFailures(0);
            la.setBlockedUntil(null);
            repo.save(la);
        });
    }
}
