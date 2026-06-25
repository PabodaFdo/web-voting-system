package com.example.votingsystem.publicapi;

import com.example.votingsystem.nominee.repository.EventRepository;
import com.example.votingsystem.nominee.repository.CategoryRepository;
import com.example.votingsystem.nominee.repository.NomineeRepository;
import com.example.votingsystem.voting.repository.VoteRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = {
        "http://localhost:5173","http://127.0.0.1:5173",
        "http://localhost:5174","http://127.0.0.1:5174",
        "http://localhost:5175","http://127.0.0.1:5175",
        "http://localhost:5176","http://127.0.0.1:5176",
        "http://localhost:5177","http://127.0.0.1:5177",
        "http://localhost:5178","http://127.0.0.1:5178"
})
public class PublicStatsController {

    private final EventRepository events;
    private final CategoryRepository categories;
    private final NomineeRepository nominees;
    private final VoteRepository votes;

    public PublicStatsController(EventRepository events,
                                 CategoryRepository categories,
                                 NomineeRepository nominees,
                                 VoteRepository votes) {
        this.events = events;
        this.categories = categories;
        this.nominees = nominees;
        this.votes = votes;
    }

    // GET /api/public/stats → { eventsActive, categories, nominees, votes, now }
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        LocalDateTime now = LocalDateTime.now();
        long activeEvents = events.countByStartAtLessThanEqualAndEndAtGreaterThanEqual(now, now);

        return Map.of(
                "eventsActive", activeEvents,
                "categories", categories.count(),
                "nominees", nominees.count(),
                "votes", votes.count(),
                "now", now.toString()
        );
    }
}
