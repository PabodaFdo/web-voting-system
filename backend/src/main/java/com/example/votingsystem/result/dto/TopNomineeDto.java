package com.example.votingsystem.result.dto;
public record TopNomineeDto(Integer rank, Long nomineeId, String nomineeName, Long totalVotes) {}
