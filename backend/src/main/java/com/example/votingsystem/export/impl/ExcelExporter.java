package com.example.votingsystem.export.impl;

import com.example.votingsystem.export.ReportExporter;
import com.example.votingsystem.export.ReportFormat;
import com.example.votingsystem.export.ReportTable;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;

@Component
public class ExcelExporter implements ReportExporter {

    @Override
    public ReportFormat getFormat() { return ReportFormat.XLSX; }

    @Override
    public byte[] export(ReportTable table) throws Exception {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Report");
            int r = 0;

            if (table.getTitle() != null && !table.getTitle().isBlank()) {
                Row titleRow = sheet.createRow(r++);
                titleRow.createCell(0).setCellValue(table.getTitle());
            }

            if (table.getHeaders() != null && !table.getHeaders().isEmpty()) {
                Row hr = sheet.createRow(r++);
                int c = 0;
                for (String h : table.getHeaders()) {
                    hr.createCell(c++).setCellValue(h == null ? "" : h);
                }
            }

            if (table.getRows() != null) {
                for (var row : table.getRows()) {
                    Row xr = sheet.createRow(r++);
                    int c = 0;
                    for (Object v : row) {
                        Cell cell = xr.createCell(c++);
                        if (v instanceof Number) {
                            cell.setCellValue(((Number) v).doubleValue());
                        } else {
                            cell.setCellValue(v == null ? "" : String.valueOf(v));
                        }
                    }
                }
            }

            int columns = table.getHeaders() == null ? 8 : table.getHeaders().size();
            for (int i = 0; i < columns; i++) sheet.autoSizeColumn(i);

            wb.write(baos);
            return baos.toByteArray();
        }
    }
}
