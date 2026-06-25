package com.example.votingsystem.nominee.controller;

import com.example.votingsystem.nominee.dto.CategoryDto;
import com.example.votingsystem.nominee.entity.Category;
import com.example.votingsystem.nominee.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")  // allow requests from any origin
@RestController  // REST controller for Category CRUD
@RequestMapping("/api/categories")  // base path for category APIs
public class CategoryController {
    private final CategoryService service;
    public CategoryController(CategoryService service) { this.service = service; }

    // get all categories
    @GetMapping public ResponseEntity<List<Category>> all() { return ResponseEntity.ok(service.findAll()); }
    // get categories by event ID
    @GetMapping("/by-event/{eventId}") public ResponseEntity<List<Category>> byEvent(@PathVariable Long eventId) { return ResponseEntity.ok(service.findByEvent(eventId)); }
    // get one category by ID
    @GetMapping("/{id}") public ResponseEntity<Category> get(@PathVariable Long id) { return ResponseEntity.ok(service.get(id)); }
    // create a new category
    @PostMapping public ResponseEntity<Category> create(@RequestBody CategoryDto dto) { return ResponseEntity.ok(service.create(dto)); }
    // update an existing category
    @PutMapping("/{id}") public ResponseEntity<Category> update(@PathVariable Long id, @RequestBody CategoryDto dto) { return ResponseEntity.ok(service.update(id, dto)); }
    // delete a category
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
