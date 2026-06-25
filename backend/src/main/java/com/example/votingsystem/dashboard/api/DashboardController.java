package com.example.votingsystem.dashboard.api;

import com.example.votingsystem.dashboard.dto.*;
import com.example.votingsystem.dashboard.service.DashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.example.votingsystem.dashboard.dto.SimpleSlice;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/kpis")
    public DashboardKpis kpis() { return service.kpis(); }

    @GetMapping("/categories")
    public List<CategoryProgressDto> categories() { return service.categoriesProgress(); }

    @GetMapping("/leaders")
    public List<NomineeVotesDto> leaders(@RequestParam Long categoryId,
                                         @RequestParam(defaultValue = "3") int limit) {
        return service.leaders(categoryId, limit);
    }

    @GetMapping("/genders")
    public List<SimpleSlice> genders(@RequestParam Long categoryId) {
        return service.gendersByVotedStudents(categoryId);
    }

    @GetMapping("/votes-by-day")
    public List<Map<String, Object>> votesByDay(@RequestParam Long categoryId) {
        return service.votesByDay(categoryId).stream()
                .map(tp -> Map.<String, Object>of(
                        "date", tp.ts().toString(),
                        "count", Long.valueOf(tp.votes())))
                .toList();
    }

    @GetMapping("/participation")
    public Participation participation(@RequestParam Long categoryId) {
        return service.participation(categoryId);
    }
}
