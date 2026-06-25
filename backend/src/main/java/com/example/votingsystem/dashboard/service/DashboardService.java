package com.example.votingsystem.dashboard.service;

import com.example.votingsystem.dashboard.dto.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.votingsystem.dashboard.dto.SimpleSlice;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

    // Stub: where you would refresh cached widgets/aggregations
    public void recalcForEvent(Long eventId) {
        log.info("[DASHBOARD SERVICE] Recalculated dashboard for event ID: {}", eventId);
    }

    @PersistenceContext
    private EntityManager em;

    public DashboardKpis kpis() {
        long totalVotes = em.createQuery("select count(v) from Vote v", Long.class).getSingleResult();
        long eligible   = em.createQuery("select count(s) from Student s", Long.class).getSingleResult();
        long activeCats = em.createQuery("select count(c) from Category c", Long.class).getSingleResult();
        double pct = (eligible == 0) ? 0.0 :
                Math.round(((double) distinctVoters() * 10000.0 / eligible)) / 100.0;
        return new DashboardKpis(totalVotes, eligible, pct, activeCats);
    }

    private long distinctVoters() {
        return em.createQuery("select count(distinct v.student.id) from Vote v", Long.class)
                .getSingleResult();
    }

    public List<CategoryProgressDto> categoriesProgress() {
        long eligible = em.createQuery("select count(s) from Student s", Long.class).getSingleResult();
        List<Object[]> rows = em.createQuery("""
            select c.id, c.name, count(v.id)
            from Category c
            left join Vote v on v.category.id = c.id
            group by c.id, c.name
            """, Object[].class).getResultList();

        return rows.stream().map(r -> {
            Long id = (Long) r[0]; String name = (String) r[1];
            long votes = (Long) r[2];
            double p = eligible == 0 ? 0.0 : Math.round((votes * 10000.0 / eligible)) / 100.0;
            return new CategoryProgressDto(id, name, votes, p);
        }).toList();
    }

    public List<NomineeVotesDto> leaders(Long categoryId, int limit) {
        List<Object[]> rows = em.createQuery("""
            select n.id, n.name, count(v.id)
            from Nominee n
            left join Vote v on v.nominee.id = n.id
            where n.category.id = :cid
            group by n.id, n.name
            order by count(v.id) desc
            """, Object[].class)
                .setParameter("cid", categoryId)
                .setMaxResults(limit <= 0 ? 3 : limit)
                .getResultList();
        return rows.stream()
                .map(r -> new NomineeVotesDto((Long) r[0], (String) r[1], (Long) r[2]))
                .toList();
    }

    public List<SimpleSlice> gendersByVotedStudents(Long categoryId) {
        List<Object[]> rows = em.createQuery("""
            select s.gender, count(v.id)
            from Vote v
            join v.student s
            where v.category.id = :cid
            group by s.gender
            order by s.gender
            """, Object[].class)
                .setParameter("cid", categoryId)
                .getResultList();
        return rows.stream()
                .map(r -> new SimpleSlice(
                        String.valueOf(r[0]),
                        ((Number) r[1]).longValue()))
                .toList();
    }

    // H2/Postgres/MySQL friendly daily grouping
    public List<TimePoint> votesByDay(Long categoryId) {
        List<Object[]> rows = em.createQuery("""
            select cast(v.createdAt as date), count(v.id)
            from Vote v
            where v.category.id = :cid
            group by cast(v.createdAt as date)
            order by cast(v.createdAt as date)
            """, Object[].class)
                .setParameter("cid", categoryId)
                .getResultList();

        return rows.stream()
                .map(r -> {
                    Object d = r[0];
                    Instant ts;
                    if (d instanceof java.sql.Date dt) ts = dt.toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
                    else if (d instanceof LocalDate ld) ts = ld.atStartOfDay(ZoneOffset.UTC).toInstant();
                    else if (d instanceof LocalDateTime ldt) ts = ldt.toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
                    else ts = Instant.parse(String.valueOf(d));
                    long cnt = ((Number) r[1]).longValue();
                    return new TimePoint(ts, cnt);
                })
                .toList();
    }

    public Participation participation(Long categoryId) {
        Long voted = em.createQuery("""
            select count(distinct v.student.id)
            from Vote v
            where v.category.id = :cid
            """, Long.class)
                .setParameter("cid", categoryId)
                .getSingleResult();

        Long eligible = em.createQuery("select count(s) from Student s", Long.class)
                .getSingleResult();

        double percent = (eligible == 0) ? 0.0 : (voted * 100.0) / eligible;
        return new Participation(eligible, voted, percent);
    }
}
