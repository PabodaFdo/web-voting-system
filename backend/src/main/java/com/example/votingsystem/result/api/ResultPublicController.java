package com.example.votingsystem.result.api;

import com.example.votingsystem.result.dto.ResultSetDetailDto;
import com.example.votingsystem.result.service.ResultService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/results")
@CrossOrigin(origins = "*")
public class ResultPublicController {
    private final ResultService svc;
    public ResultPublicController(ResultService svc) { this.svc = svc; }

    @GetMapping("/events/{eventId}")
    public ResultSetDetailDto latestPublished(@PathVariable Long eventId) {
        return svc.latestPublishedForEvent(eventId);
    }
}
