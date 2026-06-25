package com.example.votingsystem.export;

import com.example.votingsystem.result.dto.EventReportDto;
import com.example.votingsystem.result.service.EventReportService;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Converts your EventReportDto (from EventReportService) to a flat table
 * for CSV/PDF/XLSX exporters.
 */
@Component
public class EventReportAdapter {

    private final EventReportService reportService;

    public EventReportAdapter(EventReportService reportService) {
        this.reportService = reportService;
    }

    /** Winners by Category table. */
    public ReportTable buildEventWinnersTable(Long eventId) {
        EventReportDto dto = reportService.generateEventReport(eventId);
        String title = "Winners — " + dto.eventName();

        List<String> headers = List.of("Category", "Winner", "Votes");
        List<List<Object>> rows = new ArrayList<>();

        dto.winners().forEach(w -> rows.add(List.of(
                w.categoryName(),
                w.winnerName(),
                w.votes()
        )));

        return new ReportTable(title, headers, rows);
    }

    /** Category Totals table. */
    public ReportTable buildEventCategoryTotalsTable(Long eventId) {
        EventReportDto dto = reportService.generateEventReport(eventId);
        String title = "Category Vote Counts — " + dto.eventName();

        List<String> headers = List.of("Category", "Total Votes");
        List<List<Object>> rows = new ArrayList<>();

        dto.categoryVoteCounts().forEach(cv -> rows.add(List.of(
                cv.categoryName(),
                cv.totalVotes()
        )));

        return new ReportTable(title, headers, rows);
    }
}
