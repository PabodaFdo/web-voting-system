package com.example.votingsystem.admin.itc;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/itc")
public class ItcController {

    private final ItcService service;

    public ItcController(ItcService service) {
        this.service = service;
    }

    /* ===== List & Create Backup ===== */
    @GetMapping("/backups")
    public List<ItcService.BackupDto> list() throws Exception {
        return service.listBackups();
    }

    @PostMapping("/backups")
    public ItcService.BackupDto create() throws Exception {
        return service.createBackup();
    }

    /* ===== Download SQL / H2 ZIP ===== */
    @GetMapping("/backups/{id}/download-sql")
    public ResponseEntity<?> downloadSql(@PathVariable Long id) {
        try {
            var f = service.getSqlById(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + f.filename() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(f.bytes());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(new Msg("No SQL found for this backup"));
        }
    }

    @GetMapping("/backups/{id}/download-h2")
    public ResponseEntity<?> downloadH2(@PathVariable Long id) {
        try {
            var f = service.getH2ZipById(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + f.filename() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(f.bytes());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(new Msg("No H2 snapshot found for this backup"));
        }
    }

    /* ===== Restore (SQL only) ===== */
    @PostMapping("/backups/{id}/restore-sql")
    public ResponseEntity<?> restoreSql(@PathVariable Long id) throws Exception {
        service.restoreByIdSql(id);
        return ResponseEntity.ok(new Msg("restored"));
    }

    @PostMapping("/restore")
    public ResponseEntity<?> restoreUpload(@RequestParam("file") MultipartFile file) throws Exception {
        service.restoreFromMultipart(file);
        return ResponseEntity.ok(new Msg("restored"));
    }

    /* ===== Delete backup ===== */
    @DeleteMapping("/backups/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) throws Exception {
        service.deleteBackup(id);
        return ResponseEntity.ok(new Msg("deleted"));
    }

    // NOTE: there is intentionally NO /restore-h2 endpoint

    public record Msg(String status) {}
}
