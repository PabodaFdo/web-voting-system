package com.example.votingsystem.voting.service;

import com.example.votingsystem.voting.dto.*;
import com.example.votingsystem.voting.entity.Vote;
import com.example.votingsystem.voting.repository.VoteRepository;
import com.example.votingsystem.nominee.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.context.ApplicationEventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.example.votingsystem.voting.events.VoteCastEvent;
import com.example.votingsystem.voting.events.VoteResetEvent;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class VotingService {

    private static final Logger log = LoggerFactory.getLogger(VotingService.class);

    private final VoteRepository votes;
    private final EventRepository events;
    private final CategoryRepository categories;
    private final NomineeRepository nominees;
    private final com.example.votingsystem.student.repo.StudentRepository students;
    private final ApplicationEventPublisher publisher;

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Colombo");

    public VotingService(
            VoteRepository votes,
            EventRepository events,
            CategoryRepository categories,
            NomineeRepository nominees,
            com.example.votingsystem.student.repo.StudentRepository students,
            ApplicationEventPublisher publisher
    ) {
        this.votes = votes;
        this.events = events;
        this.categories = categories;
        this.nominees = nominees;
        this.students = students;
        this.publisher = publisher;
    }

    private static LocalDateTime coerceInclusiveEnd(LocalDateTime end) {
        if (end == null) return null;
        if (end.toLocalTime().equals(LocalTime.MIDNIGHT)) {
            return end.with(LocalTime.of(23, 59, 59, 999_000_000));
        }
        return end;
    }

    @Transactional
    public void castOrUpdateVote(Long studentId, VoteRequest req) {
        var event    = events.findById(req.eventId()).orElseThrow(() -> new EntityNotFoundException("Event not found"));
        var category = categories.findById(req.categoryId()).orElseThrow(() -> new EntityNotFoundException("Category not found"));
        var nominee  = nominees.findById(req.nomineeId()).orElseThrow(() -> new EntityNotFoundException("Nominee not found"));
        var student  = students.findById(studentId).orElseThrow(() -> new EntityNotFoundException("Student not found"));

        if (!Objects.equals(category.getEvent().getId(), event.getId()))
            throw new IllegalArgumentException("Category not in event");
        if (!Objects.equals(nominee.getCategory().getId(), category.getId()))
            throw new IllegalArgumentException("Nominee not in category");

        // ---- Effective voting window (inclusive) --------------------------------
        LocalDateTime now = LocalDateTime.now(APP_ZONE);

        LocalDateTime effStart = event.getStartAt();
        LocalDateTime effEnd   = coerceInclusiveEnd(event.getEndAt());

        LocalDateTime catStart = category.getVotingStart();
        LocalDateTime catEnd   = coerceInclusiveEnd(category.getVotingEnd());

        boolean categoryHasCompleteWindow = (catStart != null && catEnd != null && !catEnd.isBefore(catStart));
        if (categoryHasCompleteWindow) {
            boolean eventStillOpen = (effEnd == null) || now.isBefore(effEnd) || now.isEqual(effEnd);
            if (!(catEnd.isBefore(now) && eventStillOpen)) {
                effStart = catStart;
                effEnd   = catEnd;
            }
        }

        log.info("[VOTE WINDOW] now={}  start={}  end={}  (eventId={}, categoryId={})",
                now, effStart, effEnd, event.getId(), category.getId());

        if (effStart != null && now.isBefore(effStart)) throw new IllegalStateException("Voting not started");
        if (effEnd != null && now.isAfter(effEnd))     throw new IllegalStateException("Voting closed");
        // -------------------------------------------------------------------------

        boolean updated = false;
        Long voteId;

        var existing = votes.findByStudent_IdAndCategory_Id(student.getId(), category.getId());
        if (existing.isPresent()) {
            existing.get().setNominee(nominee);
            updated = true;
            voteId = existing.get().getId();
        } else {
            var v = new Vote();
            v.setStudent(student);
            v.setCategory(category);
            v.setNominee(nominee);
            votes.save(v);
            voteId = v.getId();
        }

        // ---- Publish Observer event ---------------------------------------------
        publisher.publishEvent(new VoteCastEvent(
                event.getId(), category.getId(), nominee.getId(), studentId, updated, voteId));
        log.info("[Observer] Published VoteCastEvent: eventId={}, categoryId={}, nomineeId={}, voterId={}, updated={}, voteId={}",
                event.getId(), category.getId(), nominee.getId(), studentId, updated, voteId);
        // -------------------------------------------------------------------------
    }

    @Transactional
    public void resetMyVote(Long studentId, Long categoryId) {
        var category = categories.findById(categoryId)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));
        var event = category.getEvent();

        LocalDateTime now = LocalDateTime.now(APP_ZONE);

        LocalDateTime effStart = event.getStartAt();
        LocalDateTime effEnd   = coerceInclusiveEnd(event.getEndAt());

        LocalDateTime catStart = category.getVotingStart();
        LocalDateTime catEnd   = coerceInclusiveEnd(category.getVotingEnd());

        boolean categoryHasCompleteWindow = (catStart != null && catEnd != null && !catEnd.isBefore(catStart));
        if (categoryHasCompleteWindow) {
            boolean eventStillOpen = (effEnd == null) || now.isBefore(effEnd) || now.isEqual(effEnd);
            if (!(catEnd.isBefore(now) && eventStillOpen)) {
                effStart = catStart;
                effEnd   = catEnd;
            }
        }

        log.info("[RESET WINDOW] now={}  start={}  end={}  (eventId={}, categoryId={})",
                now, effStart, effEnd, event.getId(), category.getId());

        if (effStart != null && now.isBefore(effStart)) throw new IllegalStateException("Voting not started");
        if (effEnd != null && now.isAfter(effEnd))     throw new IllegalStateException("Voting closed");

        votes.deleteByStudent_IdAndCategory_Id(studentId, categoryId);

        publisher.publishEvent(new VoteResetEvent(categoryId, studentId));
        log.info("[Observer] Published VoteResetEvent: categoryId={}, voterId={}", categoryId, studentId);
    }

    @Transactional(readOnly = true)
    public List<MyVoteView> myVotes(Long studentId) {
        return votes.findByStudent_Id(studentId).stream()
                .map(v -> new MyVoteView(
                        v.getCategory().getEvent().getId(),
                        v.getCategory().getId(),
                        v.getNominee().getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryResultRow> categoryResults(Long categoryId) {
        var category = categories.findById(categoryId)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));
        return category.getNominees().stream()
                .map(n -> new CategoryResultRow(
                        n.getId(), n.getName(),
                        votes.countByCategory_IdAndNominee_Id(categoryId, n.getId())))
                .sorted(Comparator.comparingLong(CategoryResultRow::votes).reversed())
                .toList();
    }
}
