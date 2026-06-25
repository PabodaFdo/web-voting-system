package com.example.votingsystem.nominee.service;

import com.example.votingsystem.nominee.dto.CategoryDto;
import com.example.votingsystem.nominee.entity.Category;
import com.example.votingsystem.nominee.entity.Event;
import com.example.votingsystem.nominee.repository.CategoryRepository;
import com.example.votingsystem.nominee.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional // wrap methods in a DB transaction
public class CategoryService {
    private final CategoryRepository repo;     // DB access for categories
    private final EventRepository eventRepo;   // DB access for events

    public CategoryService(CategoryRepository repo, EventRepository eventRepo) {
        this.repo = repo; this.eventRepo = eventRepo;
    }

    // Create a new category from DTO
    public Category create(CategoryDto dto) {
        Category c = new Category();
        apply(c, dto);          // copy DTO fields to entity
        return repo.save(c);    // save to DB
    }

    // Update an existing category by id
    public Category update(Long id, CategoryDto dto) {
        Category c = repo.findById(id).orElseThrow(); // load or fail
        apply(c, dto);                                // update fields
        return repo.save(c);                          // save changes
    }

    // Delete category by id
    public void delete(Long id) { repo.deleteById(id); }

    // Get all categories
    public List<Category> findAll() { return repo.findAll(); }

    // Get categories for a given event
    public List<Category> findByEvent(Long eventId) { return repo.findByEvent_Id(eventId); }

    // Get one category by id
    public Category get(Long id) { return repo.findById(id).orElseThrow(); }

    // Copy fields from DTO to entity (helper)
    private void apply(Category c, CategoryDto dto) {
        c.setName(dto.name());
        c.setDescription(dto.description());
        c.setVotingStart(dto.votingStart());
        c.setVotingEnd(dto.votingEnd());
        if (dto.eventId() != null) {
            Event ev = eventRepo.findById(dto.eventId()).orElseThrow(); // ensure event exists
            c.setEvent(ev);
        }
    }
}
