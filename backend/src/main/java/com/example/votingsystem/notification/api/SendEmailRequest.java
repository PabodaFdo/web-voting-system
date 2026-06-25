package com.example.votingsystem.notification.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

// Request body for sending an email now
public class SendEmailRequest {
    @NotEmpty(message = "At least one recipient is required")
    private List<@NotBlank String> recipients; // list of email addresses (no blanks)

    @NotBlank
    private String subject; // email subject (required)

    @NotBlank
    private String body; // email content (required)

    public List<String> getRecipients() { return recipients; }
    public void setRecipients(List<String> recipients) { this.recipients = recipients; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
}
