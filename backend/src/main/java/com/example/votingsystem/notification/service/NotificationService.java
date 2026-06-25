package com.example.votingsystem.notification.service;

import com.example.votingsystem.notification.api.NotificationUpdateRequest;
import com.example.votingsystem.notification.api.SendEmailRequest;
import com.example.votingsystem.notification.api.ScheduleEmailRequest;
import com.example.votingsystem.notification.model.Notification;
import com.example.votingsystem.notification.model.Notification.Status;
import com.example.votingsystem.notification.repo.NotificationRepository;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

@Service // Handles creating, scheduling, sending, and managing notifications
public class NotificationService {
    private final NotificationRepository repo;  // DB access
    private final JavaMailSender mailSender;    // email sender
    private static final AtomicInteger BATCH_SEQ = new AtomicInteger(0); // daily batch counter
    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.BASIC_ISO_DATE; // YYYYMMDD
    private static final ZoneId SG = ZoneId.of("Asia/Singapore"); // for batch IDs

    // tune as you like
    private static final int MAX_ATTEMPTS = 3; // retry limit
    private final String fromAddress;
    private final String fromName;

    public NotificationService(
            NotificationRepository repo,
            JavaMailSender mailSender,
            @Value("${app.mail.from-address:no-reply@example.com}") String fromAddress,
            @Value("${app.mail.from-name:The Bright Future Student Awards Voting Portal}") String fromName
    ) {
        this.repo = repo;
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
    }

    // ======================== READ/UPDATE SINGLE ========================

    // Get one notification or fail
    public Notification one(Long id) {
        return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
    }

    /** Update text fields on a single (not-yet-sent) notification */
    public Notification updateTextFields(Long id, NotificationUpdateRequest req) {
        Notification n = one(id);
        if (n.getStatus() == Status.SENT) throw new IllegalStateException("Cannot edit a sent notification.");

        if (req.recipient() != null && !req.recipient().isBlank()) {
            validateEmail(req.recipient().trim());
            n.setRecipient(req.recipient().trim());
        }
        if (req.subject() != null && !req.subject().isBlank()) {
            n.setSubject(req.subject().trim());
        }
        if (req.body() != null && !req.body().isBlank()) {
            n.setBody(req.body());
        }
        return repo.save(n);
    }

    // ======================== BULK SEND/SCHEDULE ========================

    /** Send NOW to many recipients */
    public List<Notification> createAndSendBulk(SendEmailRequest req) {
        var recipients = normalizeRecipients(req.getRecipients());
        validateRequired(req.getSubject(), "subject");
        validateRequired(req.getBody(), "body");

        List<Notification> result = new ArrayList<>();
        for (String to : recipients) {
            Notification n = new Notification();
            n.setRecipient(to);
            n.setSubject(req.getSubject());
            n.setBody(req.getBody());
            n.setStatus(Status.PENDING);
            n.setCreatedAt(Instant.now());
            // immediate send path (scheduledFor null or now – we’ll just send)
            repo.save(n);
            result.add(trySend(n)); // try to send right away
        }
        return result;
    }

    /** Schedule for later delivery (to many recipients) */
    public List<Notification> createScheduledBulk(ScheduleEmailRequest req) {
        var recipients = normalizeRecipients(req.getRecipients());
        validateRequired(req.getSubject(), "subject");
        validateRequired(req.getBody(), "body");
        if (req.getSendAtUtc() == null) throw new IllegalArgumentException("sendAtUtc is required");
        if (req.getSendAtUtc().isBefore(Instant.now())) {
            throw new IllegalArgumentException("sendAtUtc must be in the future");
        }

        String batchId = generateFriendlyBatchId(); // same batch id for the group

        List<Notification> result = new ArrayList<>();
        for (String to : recipients) {
            Notification n = new Notification();
            n.setBatchId(batchId);
            n.setRecipient(to);
            n.setSubject(req.getSubject());
            n.setBody(req.getBody());
            n.setStatus(Status.PENDING);
            n.setCreatedAt(Instant.now());
            n.setScheduledFor(req.getSendAtUtc()); // will be sent later by scheduler
            result.add(repo.save(n));
        }
        return result;
    }

    // Backward-compatible single-recipient helpers.
    public Notification createAndSendLegacy(String recipient, String subject, String body) {
        var req = new SendEmailRequest();
        req.setRecipients(List.of(recipient));
        req.setSubject(subject);
        req.setBody(body);
        return createAndSendBulk(req).get(0);
    }

    public Notification scheduleLegacy(String recipient, String subject, String body, Instant when) {
        var req = new ScheduleEmailRequest();
        req.setRecipients(List.of(recipient));
        req.setSubject(subject);
        req.setBody(body);
        req.setSendAtUtc(when);
        return createScheduledBulk(req).get(0);
    }

    // Reschedule, cancel, and resend

    // Change scheduled time (must be future)
    public Notification reschedule(Long id, Instant when) {
        if (when == null) throw new IllegalArgumentException("sendAtUtc is required");
        if (when.isBefore(Instant.now())) throw new IllegalArgumentException("sendAtUtc must be in the future");

        Notification n = one(id);
        if (n.getStatus() == Status.SENT) throw new IllegalStateException("Already sent.");
        n.setScheduledFor(when);
        n.setStatus(Status.PENDING);
        n.setAttempts(0);
        n.setError(null);
        return repo.save(n);
    }

    // Mark as cancelled by storing a failed status with a clear message.
    public Notification cancel(Long id) {
        Notification n = one(id);
        if (n.getStatus() == Status.SENT) throw new IllegalStateException("Already sent.");
        n.setStatus(Status.FAILED);
        n.setError("Cancelled by user");
        return repo.save(n);
    }

    @Transactional
    public Notification resend(Long id) {
        Notification n = one(id);
        n.setStatus(Status.PENDING);
        n.setError(null);
        n.setAttempts(0);
        // force immediate attempt
        n.setScheduledFor(null);
        return trySend(n);
    }

    // Scheduler batch

    @Transactional
    public void sendDueBatch() {
        Instant now = Instant.now();

        // 1) Due scheduled items
        List<Notification> due = repo.findTop100ByStatusAndScheduledForLessThanEqualOrderByScheduledForAsc(
                Status.PENDING, now);

        // 2) Immediate ones (no schedule set)
        due.addAll(repo.findTop100ByStatusAndScheduledForIsNullOrderByCreatedAtAsc(Status.PENDING));

        for (Notification n : due) {
            trySend(n); // send each due item
        }
    }

    // Core send

    // Try to send an email; update status/attempts accordingly
    public Notification trySend(Notification n) {
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mime,
                    MimeMessageHelper.MULTIPART_MODE_NO,
                    StandardCharsets.UTF_8.name()
            );
            helper.setFrom(new InternetAddress(fromAddress, fromName)); // sender
            helper.setTo(n.getRecipient());
            helper.setSubject(n.getSubject());
            helper.setText(n.getBody(), false); // plain text

            mailSender.send(mime); // send email

            n.setStatus(Status.SENT);
            n.setSentAt(Instant.now());
            n.setError(null);
        } catch (Exception ex) {
            n.setAttempts(n.getAttempts() + 1); // count failure
            n.setError(ex.getMessage());
            if (n.getAttempts() >= MAX_ATTEMPTS) {
                n.setStatus(Status.FAILED); // give up
            } else {
                n.setStatus(Status.PENDING); // retry later
                // simple backoff: retry in 60s
                n.setScheduledFor(Instant.now().plusSeconds(60));
            }
        }
        return repo.save(n); // persist changes
    }

    // Listing, archive, and delete

    // List all notifications (newest first)
    public List<Notification> listAllDesc() { return repo.findAllDesc(); }

    // Active vs archived lists
    public List<Notification> getActiveNotifications() { return repo.findByArchivedFalse(); }
    public List<Notification> getArchivedNotifications() { return repo.findByArchivedTrue(); }

    @Transactional
    public boolean archive(Long id) {
        return repo.findById(id).map(n -> {
            n.setArchived(true); // move to archive
            repo.save(n);
            return true;
        }).orElse(false);
    }

    @Transactional
    public boolean restore(Long id) {
        return repo.findById(id).map(n -> {
            n.setArchived(false); // restore from archive
            repo.save(n);
            return true;
        }).orElse(false);
    }

    @Transactional
    public void restoreAll() {
        List<Notification> archived = repo.findByArchivedTrue();
        for (Notification n : archived) n.setArchived(false);
        repo.saveAll(archived);
    }

    @Transactional
    public void deleteAllArchived() {
        repo.deleteAll(repo.findByArchivedTrue()); // bulk delete archived
    }

    @Transactional
    public void hardDelete(Long id) {
        repo.deleteById(id); // delete one by id
    }

    // ======================== HELPERS ========================

    // Ensure required text fields are present
    private static void validateRequired(String v, String field) {
        if (v == null || v.isBlank()) throw new IllegalArgumentException(field + " is required");
    }

    // Basic email validation using InternetAddress
    private static void validateEmail(String email) {
        try {
            new InternetAddress(email, true).validate();
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid email: " + email);
        }
    }

    /** Trim + dedupe + validate */
    private List<String> normalizeRecipients(List<String> raw) {
        if (raw == null || raw.isEmpty()) throw new IllegalArgumentException("recipients is required");
        // preserve insertion order while deduping
        LinkedHashSet<String> set = new LinkedHashSet<>();
        for (String r : raw) {
            if (r == null) continue;
            String t = r.trim();
            if (!t.isEmpty()) {
                validateEmail(t);
                set.add(t);
            }
        }
        if (set.isEmpty()) throw new IllegalArgumentException("No valid recipients provided");
        return new ArrayList<>(set);
    }

    // Create a readable batch id like B-20250921-0007
    private static String generateFriendlyBatchId() {
        String today = java.time.LocalDate.now(SG).format(DAY_FMT); // e.g. 20250921
        int seq = BATCH_SEQ.updateAndGet(v -> (v >= 9999) ? 1 : v + 1);
        return "B-" + today + "-" + String.format("%04d", seq);     // e.g. B-20250921-0007
    }
}
