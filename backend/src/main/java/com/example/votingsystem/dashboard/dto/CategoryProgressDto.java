package com.example.votingsystem.dashboard.dto;

public record CategoryProgressDto(
        Long categoryId,
        String categoryName,
        long votes,
        double percentOfEligible
) {}
