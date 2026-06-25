package com.example.votingsystem.nominee.controller;

import com.example.votingsystem.nominee.dto.EventDto;
import com.example.votingsystem.nominee.entity.Event;
import com.example.votingsystem.nominee.service.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService service;
    public EventController(EventService service) { this.service = service; }

    // get all events
    @GetMapping public ResponseEntity<List<Event>> all() { return ResponseEntity.ok(service.findAll()); }
    // get one event by ID
    @GetMapping("/{id}") public ResponseEntity<Event> get(@PathVariable Long id) { return ResponseEntity.ok(service.get(id)); }
    // create a new event
    @PostMapping public ResponseEntity<Event> create(@RequestBody EventDto dto) { return ResponseEntity.ok(service.create(dto)); }
    // update an existing event
    @PutMapping("/{id}") public ResponseEntity<Event> update(@PathVariable Long id, @RequestBody EventDto dto) { return ResponseEntity.ok(service.update(id, dto)); }
    // delete an event
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
