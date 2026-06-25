package com.example.votingsystem.result.service;

import com.example.votingsystem.nominee.entity.Category;
import com.example.votingsystem.nominee.entity.Event;
import com.example.votingsystem.nominee.entity.Nominee;
import com.example.votingsystem.nominee.repository.CategoryRepository;
import com.example.votingsystem.nominee.repository.EventRepository;
import com.example.votingsystem.nominee.repository.NomineeRepository;
import com.example.votingsystem.result.dto.*;
import com.example.votingsystem.voting.repository.VoteRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EventReportService {

    private final EventRepository events;
    private final CategoryRepository categories;
    private final NomineeRepository nominees;
    private final VoteRepository votes;

    public EventReportService(EventRepository events, CategoryRepository categories,
                              NomineeRepository nominees, VoteRepository votes) {
        this.events = events; this.categories = categories; this.nominees = nominees; this.votes = votes;
    }

    public List<Event> getAllEvents() {
        return events.findAll(); // UI only needs id + name
    }

    public EventReportDto generateEventReport(Long eventId) {
        Event e = events.findById(eventId).orElseThrow(() -> new EntityNotFoundException("Event not found"));
        List<Category> cats = categories.findByEvent_Id(eventId);
        List<Long> catIds = cats.stream().map(Category::getId).toList();
        List<Nominee> allNominees = nominees.findByCategory_IdIn(catIds);

        // winners + nominee breakdown
        List<CategoryWinnerDto> winners = new ArrayList<>();
        List<CategoryNomineeVotesDto> nomineeVotesByCategory = new ArrayList<>();
        for (Category c : cats) {
            var rows = votes.nomineeCountsInCategory(eventId, c.getId());
            var nomineeVotes = rows.stream()
                    .map(r -> new NomineeVotesDto((Long) r[0], (String) r[1], (Long) r[2]))
                    .toList();
            nomineeVotesByCategory.add(new CategoryNomineeVotesDto(c.getId(), c.getName(), nomineeVotes));
            if (!rows.isEmpty()) {
                Object[] top = rows.get(0);
                winners.add(new CategoryWinnerDto(c.getId(), c.getName(), (Long) top[0], (String) top[1], (Long) top[2]));
            }
        }

        // category totals
        var categoryVoteCounts = votes.categoryVoteCounts(eventId).stream()
                .map(r -> new CategoryVoteCountDto((Long) r[0], (String) r[1], (Long) r[2]))
                .toList();

        // top nominees overall
        var top = votes.topNominees(eventId, PageRequest.of(0, 10));
        List<TopNomineeDto> topNominees = new ArrayList<>();
        int rank = 1;
        for (Object[] r : top) {
            topNominees.add(new TopNomineeDto(rank++, (Long) r[0], (String) r[1], (Long) r[2]));
        }

        // daily counts
        var daily = votes.dailyCounts(eventId).stream()
                .map(r -> new DailyVoteCountDto(String.valueOf(r[0]), (Long) r[1]))
                .toList();

        return new EventReportDto(
                e.getId(),
                e.getName(),
                e.getDescription(),
                e.getStartAt(),
                e.getEndAt(),
                LocalDateTime.now(),
                cats.stream().map(c -> new SimpleIdName(c.getId(), c.getName())).toList(),
                allNominees.size(),
                allNominees.stream().map(n -> new NomineeDetailDto(
                        n.getId(), n.getName(), n.getCategory().getId(), n.getCategory().getName()
                )).toList(),
                winners,
                categoryVoteCounts,
                votes.countByEvent(eventId),
                nomineeVotesByCategory,
                topNominees,
                daily
        );
    }
}
