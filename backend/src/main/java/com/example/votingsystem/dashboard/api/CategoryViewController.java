package com.example.votingsystem.dashboard.api;

import com.example.votingsystem.dashboard.domain.CategoryView;
import com.example.votingsystem.dashboard.dto.CategoryViewDto;
import com.example.votingsystem.dashboard.service.CategoryViewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard/category-views")
public class CategoryViewController {
    private final CategoryViewService svc;
    public CategoryViewController(CategoryViewService svc){ this.svc = svc; }

    @PostMapping
    public ResponseEntity<CategoryView> create(@RequestBody CategoryViewDto d){
        return ResponseEntity.ok(svc.create(d));
    }

    @GetMapping
    public ResponseEntity<List<CategoryView>> list(@RequestParam Long categoryId){
        return ResponseEntity.ok(svc.list(categoryId));
    }

    @GetMapping("{id}")
    public ResponseEntity<CategoryView> get(@PathVariable Long id){
        return ResponseEntity.ok(svc.get(id));
    }

    @PutMapping("{id}")
    public ResponseEntity<CategoryView> update(@PathVariable Long id, @RequestBody CategoryViewDto d){
        return ResponseEntity.ok(svc.update(id, d));
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        svc.delete(id);
        return ResponseEntity.noContent().build();
    }
}
