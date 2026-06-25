package com.example.votingsystem.dashboard.dto;

import java.time.Instant;

public record TimePoint(
        Instant ts,
        long votes
) {}
