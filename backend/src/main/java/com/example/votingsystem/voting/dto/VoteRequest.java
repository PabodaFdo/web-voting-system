package com.example.votingsystem.voting.dto;

public record VoteRequest(Long eventId, Long categoryId, Long nomineeId) {}
