package com.example.votingsystem.export.impl;

import com.example.votingsystem.export.ReportExporter;
import com.example.votingsystem.export.ReportFormat;
import com.example.votingsystem.export.ReportTable;
import org.springframework.stereotype.Component;

import com.lowagie.text.Document;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import java.io.ByteArrayOutputStream;

@Component
public class PdfExporter implements ReportExporter {

    @Override
    public ReportFormat getFormat() { return ReportFormat.PDF; }

    @Override
    public byte[] export(ReportTable table) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
        PdfWriter.getInstance(doc, baos);
        doc.open();

        if (table.getTitle() != null && !table.getTitle().isBlank()) {
            Paragraph title = new Paragraph(table.getTitle());
            title.setSpacingAfter(12f);
            doc.add(title);
        }

        int cols = (table.getHeaders() != null && !table.getHeaders().isEmpty())
                ? table.getHeaders().size()
                : (table.getRows() != null && !table.getRows().isEmpty() ? table.getRows().get(0).size() : 1);

        PdfPTable pdfTable = new PdfPTable(cols);
        pdfTable.setWidthPercentage(100f);

        if (table.getHeaders() != null) {
            for (String h : table.getHeaders()) {
                pdfTable.addCell(h == null ? "" : h);
            }
        }
        if (table.getRows() != null) {
            for (var row : table.getRows()) {
                for (Object v : row) pdfTable.addCell(v == null ? "" : String.valueOf(v));
            }
        }

        doc.add(pdfTable);
        doc.close();
        return baos.toByteArray();
    }
}
