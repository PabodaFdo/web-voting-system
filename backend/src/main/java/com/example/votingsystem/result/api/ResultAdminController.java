package com.example.votingsystem.result.api;

import com.example.votingsystem.result.dto.*;
import com.example.votingsystem.result.service.ResultService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/results")
@PreAuthorize("hasRole('ADMIN')")
public class ResultAdminController {

    private final ResultService svc;
    public ResultAdminController(ResultService svc) { this.svc = svc; }

    @PostMapping
    public ResultSetDetailDto create(@RequestBody ResultSetCreateDto d, Authentication auth) {
        String by = auth != null ? auth.getName() : "admin";
        return svc.createSet(d, by);
    }

    @GetMapping
    public List<ResultSetSummaryDto> listByEvent(@RequestParam Long eventId) {
        return svc.listByEvent(eventId);
    }

    @GetMapping("/{id}")
    public ResultSetDetailDto detail(@PathVariable Long id) { return svc.getSet(id); }

    @PutMapping("/{id}")
    public ResultSetDetailDto update(@PathVariable Long id, @RequestBody ResultSetCreateDto d) {
        return svc.updateSet(id, d);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        svc.deleteSet(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/items")
    public ResultItemDto addItem(@PathVariable Long id, @RequestBody ResultItemPayload p) {
        return svc.addItem(id, p);
    }

    @PutMapping("/items/{itemId}")
    public ResultItemDto updateItem(@PathVariable Long itemId, @RequestBody ResultItemPayload p) {
        return svc.updateItem(itemId, p);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long itemId) {
        svc.deleteItem(itemId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    public ResultSetDetailDto publish(@PathVariable Long id) { return svc.publish(id); }

    @GetMapping(value = "/{id}/export.csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportCsv(@PathVariable Long id) {
        var set = svc.getSet(id);
        StringBuilder sb = new StringBuilder();
        sb.append("Category,Nominee,Position,DisplayName,PhotoURL\n");
        set.items().forEach(it -> sb.append(String.join(",",
                q(it.categoryName()), q(it.nomineeName()),
                String.valueOf(it.position()), q(it.displayName()),
                q(it.photoUrl()==null?"":it.photoUrl())
        )).append("\n"));
        byte[] data = sb.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=results-" + id + ".csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(data);
    }

    @PostMapping("/{id}/unpublish")
    public ResultSetDetailDto unpublish(@PathVariable Long id) {
        return svc.unpublish(id);
    }


    private static String q(String s){ return "\"" + (s==null?"":s.replace("\"","\"\"")) + "\""; }
}
