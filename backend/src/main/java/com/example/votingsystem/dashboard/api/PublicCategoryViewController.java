package com.example.votingsystem.dashboard.api;

import com.example.votingsystem.dashboard.repo.CategoryViewRepository;
import com.example.votingsystem.dashboard.domain.CategoryView;
import com.example.votingsystem.dashboard.service.DashboardService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/public/categories")
public class PublicCategoryViewController {
    private final CategoryViewRepository repo;
    private final DashboardService dash;
    public PublicCategoryViewController(CategoryViewRepository repo, DashboardService dash){
        this.repo = repo; this.dash = dash;
    }

    @GetMapping("{categoryId}/widgets")
    public List<Map<String,Object>> published(@PathVariable Long categoryId){
        var views = repo.findByCategoryIdAndShowPublicTrueOrderByIdAsc(categoryId);
        List<Map<String,Object>> out = new ArrayList<>();
        for (CategoryView v : views){
            Map<String,Object> row = new LinkedHashMap<>();
            row.put("id", v.getId());
            row.put("title", v.getTitle());
            row.put("chartType", v.getChartType());
            row.put("metric", v.getMetric());
            row.put("topN", v.getTopN());
            row.put("filtersJson", v.getFiltersJson());

            if (v.getMetric() == CategoryView.Metric.LEADERS){
                // DashboardService method name is leaders(categoryId, limit)
                row.put("data", dash.leaders(v.getCategoryId(),
                        Optional.ofNullable(v.getTopN()).orElse(3)));
            }
            out.add(row);
        }
        return out;
    }
}
