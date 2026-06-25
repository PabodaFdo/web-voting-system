package com.example.votingsystem.result.dto;

public record ResultItemDto(
        Long id,
        Long categoryId,
        String categoryName,
        Long nomineeId,
        String nomineeName,
        Integer position,
        String displayName,
        String photoUrl,
        Long votesCount,
        Double percent
) {}
