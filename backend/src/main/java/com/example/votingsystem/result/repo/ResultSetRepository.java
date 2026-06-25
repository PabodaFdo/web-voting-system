package com.example.votingsystem.result.repo;

import com.example.votingsystem.result.domain.ResultSet;
import com.example.votingsystem.result.domain.ResultStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResultSetRepository extends JpaRepository<ResultSet, Long> {
    List<ResultSet> findByEvent_IdOrderByCreatedAtDesc(Long eventId);
    Optional<ResultSet> findTopByEvent_IdAndStatusOrderByPublishedAtDesc(Long eventId, ResultStatus status);
}
