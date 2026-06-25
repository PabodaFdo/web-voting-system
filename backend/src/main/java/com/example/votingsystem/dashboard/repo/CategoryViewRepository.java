package com.example.votingsystem.dashboard.repo;

import com.example.votingsystem.dashboard.domain.CategoryView;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryViewRepository extends JpaRepository<CategoryView, Long> {
    List<CategoryView> findByCategoryIdAndShowPublicTrueOrderByIdAsc(Long categoryId);
    List<CategoryView> findByCategoryId(Long categoryId);
}
