package com.example.votingsystem.result.domain;

import com.example.votingsystem.nominee.entity.Event;
import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import java.time.LocalDateTime;
import java.util.ArrayList; import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "result_sets", indexes = {
        @Index(name = "ix_resultset_event", columnList = "event_id"),
        @Index(name = "ix_resultset_status", columnList = "status")
})
public class ResultSet {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name="event_id", nullable=false,
            foreignKey=@ForeignKey(name="fk_resultset_event"))
    private Event event;

    @Column(nullable=false, length=160)
    private String title;

    @Column(length=2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=20)
    private ResultStatus status = ResultStatus.DRAFT;

    @Column(nullable=false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(length=120)
    private String createdBy;

    private LocalDateTime publishedAt;

    @OneToMany(mappedBy="resultSet", cascade=CascadeType.ALL, orphanRemoval=true)
    @OrderBy("position ASC, id ASC")
    private List<ResultItem> items = new ArrayList<>();
}
