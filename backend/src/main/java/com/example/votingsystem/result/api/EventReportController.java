package com.example.votingsystem.result.api;

import com.example.votingsystem.nominee.entity.Event;
import com.example.votingsystem.result.dto.EventReportDto;
import com.example.votingsystem.result.service.EventReportService;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class EventReportController {

    private final EventReportService svc;
    public EventReportController(EventReportService svc) { this.svc = svc; }

    @GetMapping("/events")
    public List<Event> getAllEvents() {
        return svc.getAllEvents();
    }

    @GetMapping("/events/{eventId}")
    public EventReportDto getEventReport(@PathVariable Long eventId) {
        return svc.generateEventReport(eventId);
    }

    @GetMapping(value = "/events/{eventId}/export.csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportCsv(@PathVariable Long eventId) {
        EventReportDto r = svc.generateEventReport(eventId);
        StringBuilder sb = new StringBuilder();
        sb.append("Section,Col1,Col2,Col3\n");
        sb.append("Event,").append(q(r.eventName())).append(",").append(q(String.valueOf(r.eventId()))).append(",").append(q("Total Votes: "+r.totalVotes())).append("\n\n");

        sb.append("Winners by Category\nCategory,Winner,Votes\n");
        r.winners().forEach(w -> sb.append(q(w.categoryName())).append(",").append(q(w.winnerName())).append(",").append(w.votes()).append("\n"));
        sb.append("\nCategory Vote Counts\nCategory,Votes\n");
        r.categoryVoteCounts().forEach(cv -> sb.append(q(cv.categoryName())).append(",").append(cv.totalVotes()).append("\n"));
        sb.append("TOTAL,").append(r.totalVotes()).append("\n");

        byte[] data = sb.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=event-" + eventId + "-report.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(data);
    }

    @GetMapping(value = "/events/{eventId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long eventId) {
        EventReportDto r = svc.generateEventReport(eventId);
        byte[] pdf = buildPdf(r);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=event-" + eventId + "-report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    private static String q(String s){ s = (s==null?"":s).replace("\"","\"\""); return "\"" + s + "\""; }

    private static byte[] buildPdf(EventReportDto r) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 36, 36, 48, 48);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            Font H1 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font H2 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font P  = FontFactory.getFont(FontFactory.HELVETICA, 10);

            Paragraph title = new Paragraph("Event Results Report", H1);
            title.setAlignment(Element.ALIGN_CENTER);
            doc.add(title);
            doc.add(new Paragraph(r.eventName() + " (ID: " + r.eventId() + ")", H2));
            doc.add(new Paragraph("Report created: " + r.reportCreatedDate(), P));
            doc.add(new Paragraph(" "));

            PdfPTable winners = new PdfPTable(new float[]{3, 4, 2}); winners.setWidthPercentage(100);
            addHeader(winners, "Category", "Winner", "Votes");
            r.winners().forEach(w -> { winners.addCell(new Phrase(w.categoryName(), P)); winners.addCell(new Phrase(w.winnerName(), P)); winners.addCell(new Phrase(String.valueOf(w.votes()), P)); });
            doc.add(new Paragraph("Winners by Category", H2)); doc.add(winners); doc.add(new Paragraph(" "));

            PdfPTable cat = new PdfPTable(new float[]{3, 1}); cat.setWidthPercentage(100);
            addHeader(cat, "Category", "Votes");
            r.categoryVoteCounts().forEach(cv -> { cat.addCell(new Phrase(cv.categoryName(), P)); cat.addCell(new Phrase(String.valueOf(cv.totalVotes()), P)); });
            doc.add(new Paragraph("Category Vote Counts", H2)); doc.add(cat);
            doc.add(new Paragraph("Total votes collected: " + r.totalVotes(), H2));

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("PDF build failed", e);
        }
    }

    private static void addHeader(PdfPTable t, String... headers) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, f));
            cell.setGrayFill(0.9f);
            t.addCell(cell);
        }
    }
}
