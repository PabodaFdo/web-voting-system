package com.example.votingsystem.admin.itc;

import lombok.*;
import java.time.Instant;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ItcBackup {
    // String id so we can use filenames like "backup_YYYYMMDD_HHmmss" or millis
    private String id;

    private String filename;     // the .sql file name
    private Long   sizeBytes;    // .sql size in bytes

    private String filenameH2;   // optional: _h2.zip file name
    private Long   sizeH2;       // optional: _h2.zip size

    private Instant createdAt;   // when files were created
    private Instant restoredAt;  // when a restore was performed
    private String  restoredKind; // "SQL" | "H2"
}
