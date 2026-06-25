package com.example.votingsystem.result.dto;

import java.util.List;

public record CategoryNomineeVotesDto(
        Long categoryId,
        String categoryName,
        List<NomineeVotesDto> nomineeVotes
) {}

