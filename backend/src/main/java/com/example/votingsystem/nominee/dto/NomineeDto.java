package com.example.votingsystem.nominee.dto;

import jakarta.validation.constraints.*;

public record NomineeDto(
        Long id,

        @NotBlank(message = "Nominee name is required")
        @Size(max = 120, message = "Nominee name must be at most 120 characters")
        String name,

        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,

        @Size(max = 3000, message = "Bio must be at most 3000 characters")
        String bio,

        @NotNull(message = "categoryId is required")
        @Positive(message = "categoryId must be a positive number")
        Long categoryId
) {}
