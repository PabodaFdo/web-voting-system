package com.example.votingsystem.nominee.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public record CategoryDto(
        Long id,

        @NotBlank(message = "Category name is required")
        @Size(max = 120, message = "Category name must be at most 120 characters")
        String name,

        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,

        @NotNull(message = "votingStart is required")
        LocalDateTime votingStart,

        @NotNull(message = "votingEnd is required")
        LocalDateTime votingEnd,

        @NotNull(message = "eventId is required")
        @Positive(message = "eventId must be a positive number")
        Long eventId
) {
    @AssertTrue(message = "votingEnd must be after votingStart")
    public boolean isVotingEndAfterStart() {
        return votingStart == null || votingEnd == null || votingEnd.isAfter(votingStart);
    }
}
