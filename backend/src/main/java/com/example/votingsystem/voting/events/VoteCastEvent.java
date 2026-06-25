package com.example.votingsystem.voting.events;

public class VoteCastEvent {
    private final Long eventId;
    private final Long categoryId;
    private final Long nomineeId;
    private final Long voterId;
    private final boolean update;
    private final Long voteId;
    private final long timestamp = System.currentTimeMillis();

    public VoteCastEvent(Long eventId, Long categoryId, Long nomineeId,
                         Long voterId, boolean update, Long voteId) {
        this.eventId = eventId;
        this.categoryId = categoryId;
        this.nomineeId = nomineeId;
        this.voterId = voterId;
        this.update = update;
        this.voteId = voteId;
    }

    public Long getEventId() { return eventId; }
    public Long getCategoryId() { return categoryId; }
    public Long getNomineeId() { return nomineeId; }
    public Long getVoterId() { return voterId; }
    public boolean isUpdate() { return update; }
    public Long getVoteId() { return voteId; }
    public long getTimestamp() { return timestamp; }
}

