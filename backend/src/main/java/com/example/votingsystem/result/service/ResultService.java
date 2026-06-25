package com.example.votingsystem.result.service;

import com.example.votingsystem.nominee.entity.Category;
import com.example.votingsystem.nominee.entity.Event;
import com.example.votingsystem.nominee.entity.Nominee;
import com.example.votingsystem.nominee.repository.CategoryRepository;
import com.example.votingsystem.nominee.repository.EventRepository;
import com.example.votingsystem.nominee.repository.NomineeRepository;
import com.example.votingsystem.result.domain.ResultItem;
import com.example.votingsystem.result.domain.ResultSet;
import com.example.votingsystem.result.domain.ResultStatus;
import com.example.votingsystem.result.dto.*;
import com.example.votingsystem.result.repo.ResultItemRepository;
import com.example.votingsystem.result.repo.ResultSetRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class ResultService {

    private final EventRepository events;
    private final CategoryRepository categories;
    private final NomineeRepository nominees;
    private final ResultSetRepository sets;
    private final ResultItemRepository items;

    public ResultService(EventRepository events, CategoryRepository categories,
                         NomineeRepository nominees, ResultSetRepository sets,
                         ResultItemRepository items) {
        this.events = events; this.categories = categories;
        this.nominees = nominees; this.sets = sets; this.items = items;
    }

    public ResultSetDetailDto createSet(ResultSetCreateDto d, String createdBy) {
        Event ev = events.findById(d.eventId())
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        ResultSet rs = new ResultSet();
        rs.setEvent(ev);
        rs.setTitle(d.title());
        rs.setNotes(d.notes());
        rs.setStatus(ResultStatus.DRAFT);
        rs.setCreatedBy(createdBy);
        rs = sets.save(rs);

        return toDetail(rs);
    }

    @Transactional(readOnly = true)
    public List<ResultSetSummaryDto> listByEvent(Long eventId) {
        return sets.findByEvent_IdOrderByCreatedAtDesc(eventId).stream()
                .map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public ResultSetDetailDto getSet(Long id) {
        return toDetail(loadSet(id));
    }

    public ResultSetDetailDto updateSet(Long id, ResultSetCreateDto d) {
        ResultSet rs = loadSet(id);
        ensureDraft(rs);
        if (d.title() != null) rs.setTitle(d.title());
        rs.setNotes(d.notes());
        return toDetail(rs);
    }

    public void deleteSet(Long id) {
        ResultSet rs = loadSet(id);
        ensureDraft(rs);
        sets.delete(rs);
    }

    public ResultItemDto addItem(Long setId, ResultItemPayload p) {
        ResultSet rs = loadSet(setId);
        ensureDraft(rs);

        Category c = categories.findById(p.categoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));
        if (!c.getEvent().getId().equals(rs.getEvent().getId()))
            throw new IllegalArgumentException("Category not in this event");

        Nominee n = nominees.findById(p.nomineeId())
                .orElseThrow(() -> new EntityNotFoundException("Nominee not found"));
        if (!n.getCategory().getId().equals(c.getId()))
            throw new IllegalArgumentException("Nominee not in this category");

        ResultItem it = new ResultItem();
        it.setResultSet(rs);
        it.setCategory(c);
        it.setNominee(n);
        it.setPosition(p.position() != null ? p.position() : 1);
        it.setWinnerNameOverride(p.winnerNameOverride());
        // NOTE: winnerPhotoUrlOverride is intentionally NOT used anymore
        items.save(it);
        return toItemDto(it);
    }

    public ResultItemDto updateItem(Long itemId, ResultItemPayload p) {
        ResultItem it = items.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Item not found"));
        ensureDraft(it.getResultSet());

        if (p.position() != null) it.setPosition(p.position());
        it.setWinnerNameOverride(p.winnerNameOverride());
        // NOTE: winnerPhotoUrlOverride is intentionally NOT used anymore

        if (p.categoryId() != null && p.nomineeId() != null) {
            Category c = categories.findById(p.categoryId())
                    .orElseThrow(() -> new EntityNotFoundException("Category not found"));
            if (!c.getEvent().getId().equals(it.getResultSet().getEvent().getId()))
                throw new IllegalArgumentException("Category not in this event");
            Nominee n = nominees.findById(p.nomineeId())
                    .orElseThrow(() -> new EntityNotFoundException("Nominee not found"));
            if (!n.getCategory().getId().equals(c.getId()))
                throw new IllegalArgumentException("Nominee not in this category");
            it.setCategory(c); it.setNominee(n);
        }
        return toItemDto(it);
    }

    public void deleteItem(Long itemId) {
        ResultItem it = items.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Item not found"));
        ensureDraft(it.getResultSet());
        items.delete(it);
    }

    public ResultSetDetailDto publish(Long setId) {
        ResultSet rs = loadSet(setId);
        ensureDraft(rs);
        rs.setStatus(ResultStatus.PUBLISHED);
        rs.setPublishedAt(LocalDateTime.now());
        return toDetail(rs);
    }

    @Transactional(readOnly = true)
    public ResultSetDetailDto latestPublishedForEvent(Long eventId) {
        ResultSet rs = sets.findTopByEvent_IdAndStatusOrderByPublishedAtDesc(
                eventId, ResultStatus.PUBLISHED
        ).orElseThrow(() -> new EntityNotFoundException("No published results"));
        return toDetail(rs);
    }

    // --- helpers ---
    private ResultSet loadSet(Long id) {
        return sets.findById(id).orElseThrow(() -> new EntityNotFoundException("Result set not found"));
    }
    private void ensureDraft(ResultSet rs) {
        if (rs.getStatus() != ResultStatus.DRAFT)
            throw new IllegalStateException("Only DRAFT result sets can be modified");
    }

    private ResultSetSummaryDto toSummary(ResultSet rs) {
        return new ResultSetSummaryDto(
                rs.getId(),
                rs.getEvent().getId(),
                rs.getEvent().getName(),
                rs.getNotes(),
                rs.getTitle(), rs.getStatus(),
                rs.getCreatedAt(), rs.getPublishedAt(),
                rs.getItems() == null ? 0 : rs.getItems().size()
        );
    }

    private ResultSetDetailDto toDetail(ResultSet rs) {
        var list = rs.getItems() == null ? List.<ResultItem>of() : rs.getItems();
        var sorted = list.stream().sorted(Comparator
                .comparing(ResultItem::getPosition).thenComparing(ResultItem::getId)).toList();
        return new ResultSetDetailDto(
                rs.getId(),
                rs.getEvent().getId(), rs.getEvent().getName(),
                rs.getTitle(), rs.getNotes(), rs.getStatus(),
                rs.getCreatedAt(), rs.getPublishedAt(),
                sorted.stream().map(this::toItemDto).toList()
        );
    }

    private ResultItemDto toItemDto(ResultItem it) {
        // Always use nominee's stored photo endpoint
        String basePhoto = it.getNominee().getPhoto() != null
                ? ("/api/nominees/" + it.getNominee().getId() + "/photo")
                : null;

        String name = (it.getWinnerNameOverride() != null && !it.getWinnerNameOverride().isBlank())
                ? it.getWinnerNameOverride()
                : it.getNominee().getName();

        return new ResultItemDto(
                it.getId(),
                it.getCategory().getId(), it.getCategory().getName(),
                it.getNominee().getId(), it.getNominee().getName(),
                it.getPosition(),
                name,
                basePhoto,              // <- effective photo
                it.getVotesCount(), it.getPercent()
        );
    }

    public ResultSetDetailDto unpublish(Long setId) {
        ResultSet rs = loadSet(setId);
        if (rs.getStatus() != ResultStatus.PUBLISHED) {
            throw new IllegalStateException("Only PUBLISHED sets can be unpublished");
        }
        rs.setStatus(ResultStatus.DRAFT);
        rs.setPublishedAt(null);
        return toDetail(rs);
    }

}
