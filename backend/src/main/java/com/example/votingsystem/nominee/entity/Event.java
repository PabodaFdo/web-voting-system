package com.example.votingsystem.nominee.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@JsonIgnoreProperties({"hibernateLazyInitializer","handler"}) // ignore Hibernate helper fields in JSON
@Entity
@Getter
@Setter
@Table(name = "events", uniqueConstraints = {
        @UniqueConstraint(name = "uk_event_name", columnNames = "name") // event name must be unique
})
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 120)
    @Column(nullable = false, length = 120)
    private String name;

    @Size(max = 1000)
    @Column(length = 1000)
    private String description;

    private LocalDateTime startAt; // start date/time
    private LocalDateTime endAt;   // end date/time

}
