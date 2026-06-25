package com.example.votingsystem.export.impl;

import com.example.votingsystem.export.ReportExporter;
import com.example.votingsystem.export.ReportFormat;
import com.example.votingsystem.export.ReportTable;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

@Component
public class CsvExporter implements ReportExporter {

    @Override
    public ReportFormat getFormat() { return ReportFormat.CSV; }

    @Override
    public byte[] export(ReportTable table) {
        StringBuilder sb = new StringBuilder();

        // Optional title line (comment)
        if (table.getTitle() != null && !table.getTitle().isBlank()) {
            sb.append("# ").append(table.getTitle()).append("\n");
        }

        // Headers
        if (table.getHeaders() != null && !table.getHeaders().isEmpty()) {
            sb.append(table.getHeaders().stream()
                            .map(CsvExporter::esc)
                            .collect(Collectors.joining(",")))
                    .append("\n");
        }

        // Rows
        if (table.getRows() != null) {
            for (var row : table.getRows()) {
                String line = row.stream()
                        .map(val -> esc(val == null ? "" : String.valueOf(val)))
                        .collect(Collectors.joining(","));
                sb.append(line).append("\n");
            }
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static String esc(String s) {
        boolean needQuote = s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r");
        String v = s.replace("\"", "\"\"");
        return needQuote ? "\"" + v + "\"" : v;
    }
}
