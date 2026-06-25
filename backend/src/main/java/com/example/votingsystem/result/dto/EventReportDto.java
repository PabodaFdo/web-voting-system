package com.example.votingsystem.result.dto;

import java.time.LocalDateTime;
import java.util.List;

public record EventReportDto(
        Long eventId,
        String eventName,
        String eventDescription,
        LocalDateTime startDate,
        LocalDateTime endDate,
        LocalDateTime reportCreatedDate,
        List<SimpleIdName> categories,
        Integer totalNominees,
        List<NomineeDetailDto> nominees,
        List<CategoryWinnerDto> winners,
        List<CategoryVoteCountDto> categoryVoteCounts,
        Long totalVotes,
        List<CategoryNomineeVotesDto> nomineeVotesByCategory,
        List<TopNomineeDto> topNominees,
        List<DailyVoteCountDto> dailyVoteCounts
) {}
