package com.example.votingsystem.admin.auth;

import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// Exposes password reset endpoints under /api/auth
@RestController
@RequestMapping("/api/auth")
public class AuthResetController {

    private final PasswordResetService service; // Orchestrates OTP generation/validation and password update
    public AuthResetController(PasswordResetService service) { this.service = service; }

    // Request DTO for "forgot" flow (identifier = email/indexNo/username)
    public record ForgotReq(@NotBlank String identifier) {}
    // Request DTO for "reset" flow (identifier + received OTP + new password)
    public record ResetReq(@NotBlank String identifier, @NotBlank String otp, @NotBlank String newPassword) {}

    // Step 1: Request an OTP to be sent to the account's contact channel
    @PostMapping("/forgot")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, String> forgot(@RequestBody ForgotReq req) {
        service.requestOtp(req.identifier()); // Triggers OTP creation + delivery (email/SMS)
        return Map.of("message", "If an account exists, a reset code has been sent.");
    }

    // Step 2: Submit OTP and a new password to complete the reset
    @PostMapping("/reset")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, String> reset(@RequestBody ResetReq req) {
        service.resetPassword(req.identifier(), req.otp(), req.newPassword());  // Validates OTP, updates password, invalidates OTP
        return Map.of("message", "Password reset successful. You can now log in."); // Success message
    }
}
