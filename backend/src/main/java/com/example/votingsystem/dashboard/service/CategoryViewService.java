package com.example.votingsystem.dashboard.service;

import com.example.votingsystem.dashboard.domain.CategoryView;
import com.example.votingsystem.dashboard.dto.CategoryViewDto;
import com.example.votingsystem.dashboard.repo.CategoryViewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoryViewService {

    private final CategoryViewRepository repo;

    public CategoryViewService(CategoryViewRepository repo) {
        this.repo = repo;
    }

    // --- CRUD ---

    public CategoryView create(CategoryViewDto d) {
        CategoryView v = new CategoryView();
        apply(v, d);
        return repo.save(v);
    }

    @Transactional(readOnly = true)
    public List<CategoryView> list(Long categoryId) {
        return repo.findByCategoryId(categoryId);
    }

    @Transactional(readOnly = true)
    public CategoryView get(Long id) {
        return repo.findById(id).orElseThrow();
    }

    public CategoryView update(Long id, CategoryViewDto d) {
        CategoryView v = get(id);
        apply(v, d);
        return repo.save(v);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    // --- mapping DTO -> domain ---
    private void apply(CategoryView v, CategoryViewDto d) {
        v.setCategoryId(d.categoryId());
        v.setTitle(d.title());

        if (d.chartType() != null) {
            v.setChartType(CategoryView.ChartType.valueOf(d.chartType().name()));
        }
        if (d.metric() != null) {
            v.setMetric(CategoryView.Metric.valueOf(d.metric().name()));
        }

        // TOP-N handling:
        // - keep a positive value for LEADERS (default 3)
        // - write 0 for other metrics so we never persist NULL into a NOT NULL/int column
        if (d.metric() == CategoryViewDto.Metric.LEADERS) {
            Integer n = d.topN();
            v.setTopN(n == null || n < 1 ? 3 : n);
        } else {
            v.setTopN(0);  // <-- was null before; use 0 to satisfy NOT NULL / primitive int
        }

        // filtersJson was removed from the DTO — leave as-is (or clear explicitly if you prefer)
        // v.setFiltersJson(null);

        v.setShowPublic(Boolean.TRUE.equals(d.showPublic()));
    }
}
