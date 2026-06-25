package com.example.votingsystem.notification.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class NotificationScheduler {

    private final NotificationService service;

    public NotificationScheduler(NotificationService service) {
        this.service = service;
    }

    // Run every 30 seconds. Adjust as needed.
    @Scheduled(fixedDelay = 30_000)
    public void run() {
        service.sendDueBatch();
    }
}
