package com.example.votingsystem.export;

import java.util.ArrayList;
import java.util.List;

public class ReportTable {
    private String title;                 // e.g., "Event Results — 2025 Awards"
    private List<String> headers = new ArrayList<>();
    private List<List<Object>> rows = new ArrayList<>();

    public ReportTable() {}

    public ReportTable(String title, List<String> headers, List<List<Object>> rows) {
        this.title = title;
        this.headers = headers;
        this.rows = rows;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public List<String> getHeaders() { return headers; }
    public void setHeaders(List<String> headers) { this.headers = headers; }

    public List<List<Object>> getRows() { return rows; }
    public void setRows(List<List<Object>> rows) { this.rows = rows; }
}
