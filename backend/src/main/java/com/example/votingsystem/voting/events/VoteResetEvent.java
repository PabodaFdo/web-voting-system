package com.example.votingsystem.voting.events;

public class VoteResetEvent {
    private final Long categoryId;
    private final Long voterId;
    private final long timestamp = System.currentTimeMillis();

    public VoteResetEvent(Long categoryId, Long voterId) {
        this.categoryId = categoryId;
        this.voterId = voterId;
    }

    public Long getCategoryId() { return categoryId; }
    public Long getVoterId() { return voterId; }
    public long getTimestamp() { return timestamp; }
}

