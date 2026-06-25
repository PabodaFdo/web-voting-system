package com.example.votingsystem.result.dto;
public record CategoryWinnerDto(Long categoryId, String categoryName, Long winnerId, String winnerName, Long votes) {}
