package com.example.votingsystem.result.dto;

public record ResultItemPayload(
        Long categoryId,
        Long nomineeId,
        Integer position,
        String winnerNameOverride
) {}
