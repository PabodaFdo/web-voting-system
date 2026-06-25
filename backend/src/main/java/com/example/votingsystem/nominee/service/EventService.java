package com.example.votingsystem.nominee.service;

import com.example.votingsystem.nominee.dto.EventDto;
import com.example.votingsystem.nominee.entity.Event;
import com.example.votingsystem.nominee.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service                 // marks this as a service class
@Transactional           // run methods inside a DB transaction
public class EventService {
    private final EventRepository repo; // DB access for events

    public EventService(EventRepository repo) { this.repo = repo; }

    // Create a new event from DTO
    public Event create(EventDto dto) {
        Event e = new Event();
        e.setName(dto.name());
        e.setDescription(dto.description());
        e.setStartAt(dto.startAt());
        e.setEndAt(dto.endAt());
        return repo.save(e);
    }

    // Update an existing event by id using DTO data
    public Event update(Long id, EventDto dto) {
        Event e = repo.findById(id).orElseThrow();
        e.setName(dto.name());
        e.setDescription(dto.description());
        e.setStartAt(dto.startAt());
        e.setEndAt(dto.endAt());
        return repo.save(e);
    }

    // Delete an event by id
    public void delete(Long id) { repo.deleteById(id); }

    // Get all events
    public List<Event> findAll() { return repo.findAll(); }

    // Get a single event by id (or fail if not found)
    public Event get(Long id) { return repo.findById(id).orElseThrow(); }
}
