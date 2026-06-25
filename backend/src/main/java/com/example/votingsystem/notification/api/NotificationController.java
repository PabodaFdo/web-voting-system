package com.example.votingsystem.notification.api;

import com.example.votingsystem.notification.model.Notification;
import com.example.votingsystem.notification.service.NotificationService;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    /**
     * Send immediately to one or more recipients
     */
    @PostMapping(value = "/send", consumes = "application/json", produces = "application/json")
    public ResponseEntity<List<Notification>> send(@Valid @RequestBody SendEmailRequest req) {
        return ResponseEntity.ok(service.createAndSendBulk(req));
    }

    /**
     * Schedule for later delivery (to one or more recipients)
     */
    @PostMapping(value = "/schedule", consumes = "application/json", produces = "application/json")
    public ResponseEntity<List<Notification>> schedule(@Valid @RequestBody ScheduleEmailRequest req) {
        return ResponseEntity.ok(service.createScheduledBulk(req));
    }

    /**
     * List all active (non-archived) notifications
     */
    @GetMapping(produces = "application/json")
    public List<Notification> list() {
        return service.getActiveNotifications();
    }

    /**
     * Fetch one by ID (for editing or direct view)
     */
    @GetMapping(value = "/{id}", produces = "application/json")
    public ResponseEntity<Notification> one(@PathVariable Long id) {
        return ResponseEntity.ok(service.one(id));
    }

    /**
     * Resend a notification immediately
     */
    @PostMapping(value = "/resend/{id}", produces = "application/json")
    public ResponseEntity<Notification> resend(@PathVariable Long id) {
        return ResponseEntity.ok(service.resend(id));
    }

    /**
     * Cancel a pending/scheduled notification
     */
    @PostMapping(value = "/{id}/cancel", produces = "application/json")
    public ResponseEntity<Notification> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(service.cancel(id));
    }

    /**
     * Reschedule a pending notification (PATCH)
     */
    @PatchMapping(value = "/{id}/reschedule", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Notification> reschedulePatch(@PathVariable Long id,
                                                        @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.reschedule(id, Instant.parse(body.get("sendAtUtc"))));
    }

    /**
     * Update text fields (recipient/subject/body) of a pending notification
     */
    @PatchMapping(value = "/{id}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Notification> updateText(@PathVariable Long id,
                                                   @RequestBody NotificationUpdateRequest req) {
        return ResponseEntity.ok(service.updateTextFields(id, req));
    }

    /**
     * Archive a notification (soft delete)
     */
    @PatchMapping("/{id}/archive")
    public ResponseEntity<Void> archiveNotification(@PathVariable Long id) {
        boolean archived = service.archive(id);
        return archived ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    /**
     * Hard delete (permanent)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        try {
            service.hardDelete(id);
            return ResponseEntity.noContent().build();
        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * List archived notifications
     */
    @GetMapping("/archived")
    public List<Notification> archived() {
        return service.getArchivedNotifications();
    }

    /**
     * Restore a single archived notification
     */
    @PatchMapping("/{id}/restore")
    public ResponseEntity<Void> restoreNotification(@PathVariable Long id) {
        boolean restored = service.restore(id);
        return restored ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    /**
     * Restore all archived
     */
    @PatchMapping("/archived/restoreAll")
    public ResponseEntity<Void> restoreAllArchived() {
        service.restoreAll();
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete all archived permanently
     */
    @DeleteMapping("/archived/deleteAll")
    public ResponseEntity<Void> deleteAllArchived() {
        service.deleteAllArchived();
        return ResponseEntity.noContent().build();
    }
}
