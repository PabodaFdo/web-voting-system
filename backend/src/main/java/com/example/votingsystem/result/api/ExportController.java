package com.example.votingsystem.result.api;

import com.example.votingsystem.export.*;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
@Component("resultExportController")
public class ExportController {

    private final ReportExporterFactory factory;
    private final EventReportAdapter adapter;

    public ExportController(ReportExporterFactory factory, EventReportAdapter adapter) {
        this.factory = factory;
        this.adapter = adapter;
    }

    // Example: GET /api/admin/reports/events/42/export/winners?format=csv|pdf|xlsx
    @GetMapping("/events/{eventId}/export/winners")
    public ResponseEntity<byte[]> exportWinners(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "csv") String format
    ) throws Exception {
        return exportGeneric(adapter.buildEventWinnersTable(eventId), format);
    }

    // Example: GET /api/admin/reports/events/42/export/categories?format=csv|pdf|xlsx
    @GetMapping("/events/{eventId}/export/categories")
    public ResponseEntity<byte[]> exportCategoryTotals(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "csv") String format
    ) throws Exception {
        return exportGeneric(adapter.buildEventCategoryTotalsTable(eventId), format);
    }

    // ---- helper ----
    private ResponseEntity<byte[]> exportGeneric(ReportTable table, String format) throws Exception {
        ReportFormat fmt = ReportFormat.from(format);
        ReportExporter exporter = factory.get(fmt);
        byte[] bytes = exporter.export(table);

        String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmm"));
        String base = exporter.filenameBase(table);
        String filename = base + "_" + stamp + "." + fmt.ext();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(fmt.contentType()));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build());
        return ResponseEntity.ok().headers(headers).body(bytes);
    }
}
