package com.example.votingsystem.result.dto;

import com.example.votingsystem.result.domain.ResultStatus;
import java.time.LocalDateTime;
import java.util.List;

public record ResultSetDetailDto(
        Long id,
        Long eventId,
        String eventName,
        String title,
        String notes,
        ResultStatus status,
        LocalDateTime createdAt,
        LocalDateTime publishedAt,
        List<ResultItemDto> items
) {}
