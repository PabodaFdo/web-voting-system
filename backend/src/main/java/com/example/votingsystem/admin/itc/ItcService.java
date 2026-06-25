package com.example.votingsystem.admin.itc;

import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.file.*;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ItcService {

    private final DataSource dataSource;
    private final Path baseDir;
    private final Path sqlDir;
    private final Path h2Dir;

    public ItcService(DataSource dataSource) throws IOException {
        this.dataSource = dataSource;
        this.baseDir = Paths.get("backups");
        this.sqlDir = baseDir.resolve("sql");
        this.h2Dir = baseDir.resolve("h2");
        Files.createDirectories(sqlDir);
        Files.createDirectories(h2Dir);
    }

    /* ===========================
       Listing / DTO composition
       =========================== */
    public List<BackupDto> listBackups() throws IOException {
        List<BackupDto> out = new ArrayList<>();

        if (Files.exists(sqlDir)) {
            try (var s = Files.list(sqlDir)) {
                s.filter(p -> p.getFileName().toString().toLowerCase().endsWith(".sql"))
                        .forEach(p -> {
                            try {
                                String name = p.getFileName().toString();
                                Long id = parseIdFromName(name); // e.g., backup_1698067655000.sql -> 1698067655000
                                if (id == null) return;

                                long created = Files.getLastModifiedTime(p).toMillis();
                                long size = Files.size(p);

                                Path h2 = findOptional(h2Dir, id, ".zip");
                                Long sizeH2 = (h2 != null && Files.exists(h2)) ? Files.size(h2) : null;
                                String filenameH2 = (h2 != null) ? h2.getFileName().toString() : null;

                                out.add(new BackupDto(
                                        id,
                                        name,
                                        created,
                                        size,
                                        null,          // restoredAt (not tracked here)
                                        sizeH2,
                                        filenameH2
                                ));
                            } catch (IOException ignored) { }
                        });
            }
        }

        out.sort(Comparator.comparing(BackupDto::createdAt).reversed());
        return out;
    }

    /* ===========================
       Create a new backup
       - Writes BOTH .sql and H2 .zip
       =========================== */
    public BackupDto createBackup() throws Exception {
        long ts = Instant.now().toEpochMilli();

        Path sqlOut = sqlDir.resolve("backup_" + ts + ".sql");
        Path h2Out  = h2Dir.resolve("backup_" + ts + "_h2.zip");

        try (Connection c = getConn()) {
            checkH2(c);
            try (Statement st = c.createStatement()) {
                // Full schema and data export as SQL.
                st.execute("SCRIPT TO '" + norm(sqlOut) + "' CHARSET 'UTF-8'");

                // H2 online backup to a zip snapshot.
                st.execute("BACKUP TO '" + norm(h2Out) + "'");
            }
        }

        long sizeSql = Files.size(sqlOut);
        Long sizeH2 = Files.exists(h2Out) ? Files.size(h2Out) : null;

        return new BackupDto(
                ts,
                sqlOut.getFileName().toString(),
                Files.getLastModifiedTime(sqlOut).toMillis(),
                sizeSql,
                null,
                sizeH2,
                Files.exists(h2Out) ? h2Out.getFileName().toString() : null
        );
    }

    /* ===========================
       Download helpers
       =========================== */
    public SqlFile getSqlById(long id) throws IOException {
        Path p = findRequired(sqlDir, id, ".sql");
        return new SqlFile(p.getFileName().toString(), Files.readAllBytes(p));
    }

    public BinFile getH2ZipById(long id) throws IOException {
        Path p = findRequired(h2Dir, id, ".zip");
        return new BinFile(p.getFileName().toString(), Files.readAllBytes(p));
    }

    /* ===========================
       Restore (SQL only)
       =========================== */
    public void restoreFromMultipart(MultipartFile file) throws Exception {
        // Save to temp and run from the DB
        Path tmp = Files.createTempFile("restore_", ".sql");
        try {
            Files.write(tmp, file.getBytes(), StandardOpenOption.TRUNCATE_EXISTING);
            doRestoreFromSql(tmp);
        } finally {
            try { Files.deleteIfExists(tmp); } catch (Exception ignored) {}
        }
    }

    public void restoreByIdSql(long id) throws Exception {
        Path p = findRequired(sqlDir, id, ".sql");
        doRestoreFromSql(p);
    }

    private void doRestoreFromSql(Path sqlFile) throws Exception {
        try (Connection c = getConn()) {
            checkH2(c);
            try (Statement st = c.createStatement()) {
                // Clear current DB then import script
                st.execute("DROP ALL OBJECTS DELETE FILES");
                st.execute("RUNSCRIPT FROM '" + norm(sqlFile) + "' CHARSET 'UTF-8'");
            }
        }
    }

    private void checkH2(Connection c) throws SQLException {
        String url = c.getMetaData().getURL();
        if (url == null || !url.contains("jdbc:h2:")) {
            throw new UnsupportedOperationException("Backup and restore operations are only supported when using an H2 database.");
        }
    }

    /* ===========================
       Delete a backup (SQL + H2)
       =========================== */
    public void deleteBackup(long id) throws IOException {
        Path sql = findOptional(sqlDir, id, ".sql");
        if (sql != null) Files.deleteIfExists(sql);

        Path h2 = findOptional(h2Dir, id, ".zip");
        if (h2 != null) Files.deleteIfExists(h2);
    }

    /* ===========================
       Utilities
       =========================== */
    private Connection getConn() throws SQLException {
        return DataSourceUtils.getConnection(dataSource);
    }

    private static String norm(Path p) {
        // Escape for H2 SQL string literal
        return p.toAbsolutePath().toString()
                .replace("\\", "\\\\")
                .replace("'", "''");
    }

    private static final Pattern ID_NUM = Pattern.compile("(\\d{10,})");

    private Long parseIdFromName(String name) {
        // Accepts: backup_<millis>.sql / backup_<millis>_h2.zip / <millis>.sql etc.
        Matcher m = ID_NUM.matcher(name);
        if (m.find()) {
            try { return Long.parseLong(m.group(1)); } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private Path findRequired(Path dir, long id, String ext) throws IOException {
        Path p = findOptional(dir, id, ext);
        if (p == null || !Files.exists(p)) throw new IOException("File not found for id=" + id + ext);
        return p;
    }

    private Path findOptional(Path dir, long id, String ext) throws IOException {
        if (!Files.exists(dir)) return null;
        try (var s = Files.list(dir)) {
            return s.filter(p -> {
                        String n = p.getFileName().toString().toLowerCase();
                        return n.endsWith(ext) &&
                                (n.equals(id + ext) || n.contains("backup_" + id) || n.startsWith(id + "_"));
                    })
                    .findFirst()
                    .orElse(null);
        }
    }

    /* ===== DTOs / wrappers ===== */
    public record BackupDto(
            Long id, String filename, Long createdAt, Long sizeBytes, Long restoredAt,
            Long sizeH2, String filenameH2
    ) {}
    public record SqlFile(String filename, byte[] bytes) {}
    public record BinFile(String filename, byte[] bytes) {}
}
