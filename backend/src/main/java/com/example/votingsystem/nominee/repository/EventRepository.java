package com.example.votingsystem.nominee.repository;

import com.example.votingsystem.nominee.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    Optional<Event> findByNameIgnoreCase(String name);

    // used by public stats / active list
    long countByStartAtLessThanEqualAndEndAtGreaterThanEqual(LocalDateTime now1, LocalDateTime now2);
    List<Event> findByStartAtLessThanEqualAndEndAtGreaterThanEqual(LocalDateTime now1, LocalDateTime now2);
}
