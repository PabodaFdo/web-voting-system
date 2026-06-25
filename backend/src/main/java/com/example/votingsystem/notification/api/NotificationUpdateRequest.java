package com.example.votingsystem.notification.api;

public record NotificationUpdateRequest(
        String recipient,
        String subject,
        String body
) {}
