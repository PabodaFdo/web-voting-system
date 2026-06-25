package com.example.votingsystem.nominee.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public record EventDto(
        Long id,

        @NotBlank(message = "Event name is required")
        @Size(max = 120, message = "Event name must be at most 120 characters")
        String name,

        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,

        @NotNull(message = "startAt is required")
        LocalDateTime startAt,

        @NotNull(message = "endAt is required")
        LocalDateTime endAt
) {
    @AssertTrue(message = "endAt must be after startAt")
    public boolean isEndAfterStart() {
        return startAt == null || endAt == null || endAt.isAfter(startAt);
    }
}
