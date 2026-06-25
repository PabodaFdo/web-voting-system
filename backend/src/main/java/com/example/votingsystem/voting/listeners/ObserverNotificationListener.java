package com.example.votingsystem.voting.listeners;

import com.example.votingsystem.voting.events.VoteCastEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class ObserverNotificationListener {
    private static final Logger log = LoggerFactory.getLogger(ObserverNotificationListener.class);

    @EventListener
    public void onVoteCast(VoteCastEvent e) {
        log.info("[OBSERVER NOTIFIED] CAST vote event fired for studentId={}", e.getVoterId());
    }
}


