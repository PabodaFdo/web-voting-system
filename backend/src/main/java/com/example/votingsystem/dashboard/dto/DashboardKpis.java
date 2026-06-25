package com.example.votingsystem.dashboard.dto;

public record DashboardKpis(
        long totalVotes,
        long eligibleVoters,
        double participationPct,
        long categoriesActive
) {}
