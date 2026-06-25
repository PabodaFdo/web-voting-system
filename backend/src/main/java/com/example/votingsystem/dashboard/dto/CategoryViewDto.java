package com.example.votingsystem.dashboard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryViewDto(
        Long id,
        Long categoryId,

        // Title: required, trimmed length 3..80
        @NotBlank(message = "title is required")
        @Size(min = 3, max = 80, message = "title must be between 3 and 80 characters")
        String title,
        ChartType chartType,
        Metric metric,
        Integer topN,
        Boolean showPublic
) {
    public enum ChartType { BAR, LINE, PIE }
    public enum Metric { LEADERS, GENDERS, VOTES_BY_DAY, PARTICIPATION }
}
