package com.example.votingsystem.result.repo;

import com.example.votingsystem.result.domain.ResultItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResultItemRepository extends JpaRepository<ResultItem, Long> {
    List<ResultItem> findByResultSet_IdOrderByPositionAsc(Long setId);
}
