package com.example.votingsystem.publicapi;

import com.example.votingsystem.nominee.entity.Event;
import com.example.votingsystem.nominee.entity.Category;
import com.example.votingsystem.nominee.repository.EventRepository;
import com.example.votingsystem.nominee.repository.CategoryRepository;
import com.example.votingsystem.nominee.repository.NomineeRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController // public read-only API for events, categories, nominees
@RequestMapping("/api/public")
@CrossOrigin(origins = {
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174"
})
public class PublicQueryController {

    // Simple DTOs returned to the frontend
    public static record EventDto(Long id, String name, String description,
                                  LocalDateTime startAt, LocalDateTime endAt) {}
    public static record CategoryDto(Long id, String name, String description, Long eventId) {}
    public static record NomineeDto(Long id, String name, String description,
                                    Long categoryId, String categoryName, String photo) {}
    public static record EventBundle(EventDto event, List<CategoryDto> categories, List<NomineeDto> nominees) {}

    private final EventRepository events;           // DB access: events
    private final CategoryRepository categories;    // DB access: categories
    private final NomineeRepository nominees;       // DB access: nominees

    public PublicQueryController(EventRepository events,
                                 CategoryRepository categories,
                                 NomineeRepository nominees) {
        this.events = events;
        this.categories = categories;
        this.nominees = nominees;
    }

    // GET /api/public/events → list all events
    @GetMapping("/events")
    public List<EventDto> events() {
        return events.findAll().stream()
                .map(e -> new EventDto(
                        e.getId(),
                        e.getName(),
                        e.getDescription(),           // include description
                        e.getStartAt(),
                        e.getEndAt()
                ))
                .toList();
    }

    // GET /api/public/categories → list all categories
    @GetMapping("/categories")
    public List<CategoryDto> categories() {
        return categories.findAll().stream()
                .map(c -> new CategoryDto(
                        c.getId(),
                        c.getName(),
                        c.getDescription(),           // include description
                        c.getEvent() != null ? c.getEvent().getId() : null
                ))
                .toList();
    }

    // GET /api/public/nominees → list all nominees (with category info + photo URL)
    @GetMapping("/nominees")
    public List<NomineeDto> nominees() {
        return nominees.findAll().stream()
                .map(n -> new NomineeDto(
                        n.getId(),
                        n.getName(),
                        n.getBio(),
                        n.getCategory() != null ? n.getCategory().getId() : null,
                        n.getCategory() != null ? n.getCategory().getName() : null,
                        (n.getPhoto() != null ? ("/api/nominees/" + n.getId() + "/photo") : null)
                ))
                .toList();
    }

    // GET /api/public/events/{eventId}/bundle
    // → event + its categories + their nominees (one payload for public page)
    @GetMapping("/events/{eventId}/bundle")
    public EventBundle bundle(@PathVariable Long eventId) {
        Event e = events.findById(eventId).orElse(null);

        EventDto ev = (e == null) ? null :
                new EventDto(
                        e.getId(),
                        e.getName(),
                        e.getDescription(),
                        e.getStartAt(),
                        e.getEndAt()
                );

        List<Category> catList = categories.findByEvent_Id(eventId);
        List<CategoryDto> catDtos = catList.stream()
                .map(c -> new CategoryDto(
                        c.getId(),
                        c.getName(),
                        c.getDescription(),
                        eventId
                ))
                .toList();

        var catIds = catList.stream().map(Category::getId).toList();

        List<NomineeDto> nomDtos = catIds.isEmpty() ? List.of()
                : nominees.findByCategory_IdIn(catIds).stream()
                .map(n -> new NomineeDto(
                        n.getId(),
                        n.getName(),
                        n.getBio(),
                        n.getCategory() != null ? n.getCategory().getId() : null,
                        n.getCategory() != null ? n.getCategory().getName() : null,
                        (n.getPhoto() != null ? ("/api/nominees/" + n.getId() + "/photo") : null)
                ))
                .toList();

        return new EventBundle(ev, catDtos, nomDtos);
    }

    // GET /api/public/events/active → events where startAt <= now <= endAt
    @GetMapping("/events/active")
    public List<EventDto> activeEvents() {
        LocalDateTime now = LocalDateTime.now();
        return events.findByStartAtLessThanEqualAndEndAtGreaterThanEqual(now, now)
                .stream()
                .map(e -> new EventDto(
                        e.getId(),
                        e.getName(),
                        e.getDescription(),
                        e.getStartAt(),
                        e.getEndAt()
                ))
                .toList();
    }

}
