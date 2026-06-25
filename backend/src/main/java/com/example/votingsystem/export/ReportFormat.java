package com.example.votingsystem.export;

public enum ReportFormat {
    CSV("text/csv", "csv"),
    PDF("application/pdf", "pdf"),
    XLSX("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx");

    private final String contentType;
    private final String ext;

    ReportFormat(String contentType, String ext) {
        this.contentType = contentType;
        this.ext = ext;
    }
    public String contentType() { return contentType; }
    public String ext() { return ext; }

    public static ReportFormat from(String s) {
        if (s == null) return CSV;
        switch (s.toLowerCase()) {
            case "pdf":  return PDF;
            case "xlsx": return XLSX;
            default:     return CSV;
        }
    }
}
