package com.example.votingsystem.dashboard.api;

import com.example.votingsystem.dashboard.dto.NomineeVotesDto;
import com.example.votingsystem.dashboard.dto.SimpleSlice;
import com.example.votingsystem.dashboard.service.DashboardService;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.RecordComponent;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/dashboard/exports")
@PreAuthorize("hasRole('ADMIN')")
@Component("dashboardExportController")
public class ExportController {

    private final DashboardService dash;
    public ExportController(DashboardService dash) { this.dash = dash; }

    private ResponseEntity<byte[]> csv(String filename, String content) {
        byte[] body = content.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(body);
    }

    private static <T> Object getComponent(T record, int index) {
        try {
            RecordComponent[] comps = record.getClass().getRecordComponents();
            return comps[index].getAccessor().invoke(record);
        } catch (Exception e) {
            throw new RuntimeException("Failed to read record component #" + index + " from " + record, e);
        }
    }

    @GetMapping(value = "/leaders", produces = "text/csv")
    public ResponseEntity<byte[]> exportLeaders(@RequestParam Long categoryId,
                                                @RequestParam(defaultValue = "3") int topN) {
        List<NomineeVotesDto> leaders = dash.leaders(categoryId, topN);
        StringBuilder sb = new StringBuilder("nomineeId,nomineeName,votes\n");
        for (var r : leaders) {
            sb.append(r.nomineeId()).append(',')
                    .append(r.nomineeName().replace(",", " "))
                    .append(',').append(r.votes()).append('\n');
        }
        return csv("leaders_category_" + categoryId + "_top" + topN + ".csv", sb.toString());
    }

    @GetMapping(value = "/genders", produces = "text/csv")
    public ResponseEntity<byte[]> exportGenders(@RequestParam Long categoryId) {
        List<SimpleSlice> slices = dash.gendersByVotedStudents(categoryId);
        StringBuilder sb = new StringBuilder("gender,count\n");
        for (var s : slices) {
            sb.append(s.name().replace(",", " "))
                    .append(',').append(s.value()).append('\n');
        }
        return csv("genders_category_" + categoryId + ".csv", sb.toString());
    }

    @GetMapping(value = "/votes-by-day", produces = "text/csv")
    public ResponseEntity<byte[]> exportVotesByDay(@RequestParam Long categoryId) {
        var rows = dash.votesByDay(categoryId); // List<TimePoint> (record: ts, votes)
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE; // yyyy-MM-dd

        StringBuilder sb = new StringBuilder("date,votes\n");
        for (var p : rows) {
            Object tObj = getComponent(p, 0);
            Object vObj = getComponent(p, 1);

            Instant ts = (tObj instanceof Instant) ? (Instant) tObj : Instant.parse(String.valueOf(tObj));
            long votes = (vObj instanceof Number) ? ((Number) vObj).longValue() : Long.parseLong(String.valueOf(vObj));

            sb.append(fmt.format(ts.atZone(ZoneOffset.UTC))).append(',').append(votes).append('\n');
        }
        return csv("votes_by_day_category_" + categoryId + ".csv", sb.toString());
    }

    @GetMapping(value = "/participation", produces = "text/csv")
    public ResponseEntity<byte[]> exportParticipation(@RequestParam Long categoryId) {
        var all = dash.categoriesProgress(); // record order: id, name, votes, pct
        Object row = null;
        for (var r : all) {
            Object idObj = getComponent(r, 0);
            Long id = (idObj instanceof Number) ? ((Number) idObj).longValue() : Long.parseLong(String.valueOf(idObj));
            if (Objects.equals(id, categoryId)) { row = r; break; }
        }

        StringBuilder sb = new StringBuilder("categoryId,categoryName,votes,participationPct\n");
        if (row != null) {
            Object idObj   = getComponent(row, 0);
            Object nameObj = getComponent(row, 1);
            Object vObj    = getComponent(row, 2);
            Object pctObj  = getComponent(row, 3);

            long id   = (idObj instanceof Number) ? ((Number) idObj).longValue() : Long.parseLong(String.valueOf(idObj));
            String nm = String.valueOf(nameObj).replace(",", " ");
            long v    = (vObj  instanceof Number) ? ((Number) vObj).longValue() : Long.parseLong(String.valueOf(vObj));
            String pct= String.valueOf(pctObj);

            sb.append(id).append(',').append(nm).append(',').append(v).append(',').append(pct).append('\n');
        }
        return csv("participation_category_" + categoryId + ".csv", sb.toString());
    }
}
