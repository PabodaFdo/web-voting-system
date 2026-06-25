package com.example.votingsystem.result.dto;

import com.example.votingsystem.result.domain.ResultStatus;
import java.time.LocalDateTime;

public record ResultSetSummaryDto(
        Long id,
        Long eventId,
        String eventName,
        String title,
        String notes,
        ResultStatus status,
        LocalDateTime createdAt,
        LocalDateTime publishedAt,
        int itemsCount
) {}
