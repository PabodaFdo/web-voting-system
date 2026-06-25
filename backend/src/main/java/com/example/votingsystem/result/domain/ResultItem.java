package com.example.votingsystem.result.domain;

import com.example.votingsystem.nominee.entity.Category;
import com.example.votingsystem.nominee.entity.Nominee;
import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "result_items", indexes = {
        @Index(name="ix_resultitem_resultset", columnList = "result_set_id"),
        @Index(name="ix_resultitem_category", columnList = "category_id")
})
public class ResultItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional=false, fetch=FetchType.LAZY)
    @JoinColumn(name="result_set_id", nullable=false,
            foreignKey=@ForeignKey(name="fk_resultitem_set"))
    private ResultSet resultSet;

    @ManyToOne(optional=false, fetch=FetchType.LAZY)
    @JoinColumn(name="category_id", nullable=false,
            foreignKey=@ForeignKey(name="fk_resultitem_category"))
    private Category category;

    @ManyToOne(optional=false, fetch=FetchType.LAZY)
    @JoinColumn(name="nominee_id", nullable=false,
            foreignKey=@ForeignKey(name="fk_resultitem_nominee"))
    private Nominee nominee;

    // 1 = Winner, 2 = Runner-up, etc. You mostly need 1.
    @Column(nullable=false)
    private int position = 1;

    // Optional overrides (if you want to change display name/photo on publish)
    @Column(length=200)
    private String winnerNameOverride;

    @Column(length=1000)
    private String winnerPhotoUrlOverride;

    // Optional stats (if you want to store snapshot)
    private Long votesCount;
    private Double percent;
}
