package com.example.votingsystem.export;

public interface ReportExporter {
    ReportFormat getFormat();

    /** Return file bytes (ready to download) for the given table. */
    byte[] export(ReportTable table) throws Exception;

    /** Suggested filename WITHOUT extension (controller will append). */
    default String filenameBase(ReportTable table) {
        return (table.getTitle() == null || table.getTitle().isBlank())
                ? "report" : table.getTitle().replaceAll("[^a-zA-Z0-9-_]+", "_");
    }
}
