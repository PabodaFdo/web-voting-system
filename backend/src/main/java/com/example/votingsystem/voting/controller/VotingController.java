package com.example.votingsystem.voting.controller;

import com.example.votingsystem.voting.dto.*;
import com.example.votingsystem.voting.service.VotingService;
import com.example.votingsystem.admin.security.StudentDetailsImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Voting APIs (students vote, see own votes, see results)
@RestController
@RequestMapping("/api/vote")
public class VotingController {

    private final VotingService service; // business logic
    public VotingController(VotingService service){ this.service = service; }

    // Cast or update a vote (students only)
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> vote(@AuthenticationPrincipal Object principal,
                                  @RequestBody VoteRequest req) {
        if (!(principal instanceof StudentDetailsImpl s))
            return ResponseEntity.status(403).body("Only students can vote");
        service.castOrUpdateVote(s.student().getId(), req);
        return ResponseEntity.ok().build();
    }

    // Get my votes (current student)
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public List<MyVoteView> my(@AuthenticationPrincipal StudentDetailsImpl s) {
        return service.myVotes(s.student().getId());
    }

    // See results for a category (students/admin/organizer)
    @GetMapping("/category/{categoryId}/results")
    @PreAuthorize("hasAnyRole('STUDENT','ADMIN','ORGANIZER')")
    public List<CategoryResultRow> results(@PathVariable Long categoryId) {
        return service.categoryResults(categoryId);
    }

    // Delete my vote in a category (while event active, students only)
    @DeleteMapping("/category/{categoryId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> deleteMyVote(@AuthenticationPrincipal StudentDetailsImpl s,
                                          @PathVariable Long categoryId) {
        service.resetMyVote(s.student().getId(), categoryId);
        return ResponseEntity.noContent().build();
    }
}
