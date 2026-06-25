package com.example.votingsystem.notification.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

// Request body for scheduling an email
public class ScheduleEmailRequest {
    @NotEmpty(message = "At least one recipient is required")
    private List<@NotBlank String> recipients; // list of email addresses (no blanks)

    @NotBlank
    private String subject; // email subject (required)

    @NotBlank
    private String body; // email body/content (required)

    @NotNull
    private Instant sendAtUtc; // when to send (UTC time, required)

    public List<String> getRecipients() { return recipients; }
    public void setRecipients(List<String> recipients) { this.recipients = recipients; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public Instant getSendAtUtc() { return sendAtUtc; }
    public void setSendAtUtc(Instant sendAtUtc) { this.sendAtUtc = sendAtUtc; }
}
