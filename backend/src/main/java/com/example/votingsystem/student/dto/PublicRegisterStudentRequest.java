package com.example.votingsystem.student.dto;

import com.example.votingsystem.student.domain.Gender;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.*;

public record PublicRegisterStudentRequest(
        @Pattern(regexp = "[Ii][Tt][0-9]{4}[A-Za-z0-9_]{4}", message = "Index format like IT2410xxxx")
        @NotBlank String indexNo,

        @NotBlank String fullName,

        @Email @NotBlank String email,

        @NotBlank @Size(min = 6, max = 120) String password,

        @Nullable Gender gender
) {}
