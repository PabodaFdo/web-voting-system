package com.example.votingsystem.voting.listeners;

import com.example.votingsystem.dashboard.service.DashboardCounterService;
import com.example.votingsystem.voting.events.VoteCastEvent;
import com.example.votingsystem.voting.events.VoteResetEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class DashboardUpdateListener {
    private final DashboardCounterService counters;

    public DashboardUpdateListener(DashboardCounterService counters) {
        this.counters = counters;
    }

    @EventListener
    public void onVoteCast(VoteCastEvent e) {
        counters.bump(e.getEventId(), e.getCategoryId());
    }

    @EventListener
    public void onVoteReset(VoteResetEvent e) {
        // Negative eventId just to distinguish in logs (optional)
        counters.bump(-1L, e.getCategoryId());
    }
}


