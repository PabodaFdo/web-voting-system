package com.example.votingsystem.notification.repo;

import com.example.votingsystem.notification.model.Notification;
import com.example.votingsystem.notification.model.Notification.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // List newest first (used in UI sometimes)
    @Query("select n from Notification n where n.archived = false order by n.createdAt desc")
    List<Notification> findAllDesc();

    List<Notification> findByArchivedFalse();
    List<Notification> findByArchivedTrue();

    // Scheduler queries (limit “top 100” to avoid huge batches)
    List<Notification> findTop100ByStatusAndScheduledForLessThanEqualOrderByScheduledForAsc(
            Status status, Instant untilInclusive);

    List<Notification> findTop100ByStatusAndScheduledForIsNullOrderByCreatedAtAsc(
            Status status);
}
