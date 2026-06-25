package com.example.votingsystem.export;

import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class ReportExporterFactory {
    private final Map<ReportFormat, ReportExporter> map = new EnumMap<>(ReportFormat.class);

    public ReportExporterFactory(List<ReportExporter> exporters) {
        for (ReportExporter e : exporters) map.put(e.getFormat(), e);
    }

    public ReportExporter get(ReportFormat format) {
        ReportExporter e = map.get(format);
        if (e == null) throw new IllegalArgumentException("No exporter for format: " + format);
        return e;
    }
}
