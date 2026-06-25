package com.example.votingsystem.dashboard.dto;

public record NomineeVotesDto(
        Long nomineeId,
        String nomineeName,
        long votes
) {}
