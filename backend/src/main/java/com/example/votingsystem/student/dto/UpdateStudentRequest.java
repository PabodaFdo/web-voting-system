package com.example.votingsystem.student.dto;

import com.example.votingsystem.student.domain.Gender;
import jakarta.annotation.Nullable;

/** All fields optional; only provided ones will be updated. */
public record UpdateStudentRequest(
        @Nullable String fullName,
        @Nullable String email,
        @Nullable Gender gender,
        @Nullable Boolean active
) {}
