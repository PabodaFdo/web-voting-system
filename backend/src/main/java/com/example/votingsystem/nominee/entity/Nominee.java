package com.example.votingsystem.nominee.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
@Entity
@Getter
@Setter
@Table(name = "nominees", indexes = {
        @Index(name = "ix_nominee_category", columnList = "category_id")
})
public class Nominee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 120)
    @Column(nullable = false, length = 120)
    private String name;

    @Size(max = 1000)
    @Column(length = 1000)
    private String bio;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    private byte[] photo;

    // e.g., "image/jpeg", "image/png"
    @Column(length = 100)
    private String photoContentType;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_nominee_category"))
    private Category category;

}
