package com.example.votingsystem.voting.listeners;

import com.example.votingsystem.voting.events.VoteCastEvent;
import com.example.votingsystem.voting.events.VoteResetEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class AuditLogListener {
    private static final Logger log = LoggerFactory.getLogger(AuditLogListener.class);
    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Colombo");
    // Example: 2025-10-16T11:50:25.243+0530
    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSZ");

    private static String now() { return FMT.format(ZonedDateTime.now(APP_ZONE)); }

    @EventListener
    public void onVoteCast(VoteCastEvent e) {
        log.info("[AUDIT] {} | type=CAST student={} event={} category={} voteId={}",
                now(), e.getVoterId(), e.getEventId(), e.getCategoryId(), e.getVoteId());
    }

    @EventListener
    public void onVoteReset(VoteResetEvent e) {
        log.info("[AUDIT] {} | type=RESET student={} category={}",
                now(), e.getVoterId(), e.getCategoryId());
    }
}
