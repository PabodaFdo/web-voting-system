package com.example.votingsystem.dashboard.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;

@Setter
@Getter
@Entity @Table(name = "category_view")
public class CategoryView {
    public enum ChartType { BAR, PIE, LINE }
    public enum Metric { LEADERS, GENDERS, VOTES_BY_DAY, PARTICIPATION }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long categoryId;             // keep simple; or map to Category entity if you have it
    private String title;

    @Enumerated(EnumType.STRING)
    private ChartType chartType;

    @Enumerated(EnumType.STRING)
    private Metric metric;

    // make NOT NULL safe: default 0 for non-leaders
    @Column(nullable = false)
    private Integer topN;                 // e.g., top 3 leaders
    @Column(columnDefinition = "TEXT")
    private String filtersJson;           // JSON string for extra filters
    private boolean showPublic = false;   // publish to public event?

    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist void prePersist(){ createdAt = updatedAt = Instant.now(); }
    @PreUpdate  void preUpdate(){ updatedAt = Instant.now(); }

}
