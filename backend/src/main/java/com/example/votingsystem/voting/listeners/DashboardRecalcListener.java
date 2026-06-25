package com.example.votingsystem.voting.listeners;

import com.example.votingsystem.dashboard.service.DashboardService;
import com.example.votingsystem.voting.events.VoteCastEvent;
import com.example.votingsystem.voting.events.VoteResetEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class DashboardRecalcListener {
    private final DashboardService dashboard;

    public DashboardRecalcListener(DashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @EventListener
    public void onVoteCast(VoteCastEvent e) {
        dashboard.recalcForEvent(e.getEventId());
    }

    @EventListener
    public void onVoteReset(VoteResetEvent e) {
    }
}


