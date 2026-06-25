package com.example.votingsystem.student.dto;

import com.example.votingsystem.student.domain.Gender;
import jakarta.validation.constraints.*;

public record CreateStudentRequest(
        @Pattern(
                regexp = "(?i)^it[0-9]{4}[A-Za-z0-9_]{4}$",
                message = "Index must be IT/it + 4 digits + 4 letters/digits/_"
        )
        String indexNo,

        @NotBlank String fullName,

        @Email @NotBlank String email,

        @NotBlank @Size (min=6, max=120)
        String password,

        @NotNull Gender gender,

        boolean active
) {}
