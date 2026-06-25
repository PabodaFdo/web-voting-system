package com.example.votingsystem.dashboard.api;

import com.example.votingsystem.nominee.repository.CategoryRepository;
import com.example.votingsystem.nominee.repository.NomineeRepository;
import com.example.votingsystem.voting.repository.VoteRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatsController {

    private final CategoryRepository categories;
    private final NomineeRepository nominees;
    private final VoteRepository votes;

    public AdminStatsController(
            CategoryRepository categories,
            NomineeRepository nominees,
            VoteRepository votes
    ) {
        this.categories = categories;
        this.nominees = nominees;
        this.votes = votes;
    }

    // Returns real counts from your JPA repositories
    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        long cat = categories.count();
        long nom = nominees.count();
        long vot = votes.count(); // total votes across all categories
        return new AdminStatsResponse(cat, nom, vot);
    }

    // Simple POJO response to avoid record/ Lombok dependencies
    public static class AdminStatsResponse {
        private long categories;
        private long nominees;
        private long votes;

        public AdminStatsResponse(long categories, long nominees, long votes) {
            this.categories = categories;
            this.nominees = nominees;
            this.votes = votes;
        }
        public long getCategories() { return categories; }
        public long getNominees() { return nominees; }
        public long getVotes() { return votes; }
    }
}
