package com.example.votingsystem.nominee.controller;

import com.example.votingsystem.nominee.dto.NomineeDto;
import com.example.votingsystem.nominee.entity.Nominee;
import com.example.votingsystem.nominee.service.NomineeService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/nominees")
public class NomineeController {

    private final NomineeService service;

    public NomineeController(NomineeService service) {
        this.service = service;
    }

    @GetMapping // get all nominees
    public ResponseEntity<List<Nominee>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/by-category/{categoryId}")  // get nominees in a category
    public ResponseEntity<List<Nominee>> byCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(service.findByCategory(categoryId));
    }

    @GetMapping("/{id}") // get one nominee by ID
    public ResponseEntity<Nominee> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }

    // Expecting multipart/form-data with:
    //   dto   -> JSON (NomineeDto)
    //   photo -> file (optional)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Nominee> create(
            @RequestPart("dto") NomineeDto dto,
            @RequestPart(value = "photo", required = false) MultipartFile photo
    ) throws IOException {
        return ResponseEntity.ok(service.create(dto, photo));
    }

    // Update nominee (fields and optional new photo)
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Nominee> update(
            @PathVariable Long id,
            @RequestPart("dto") NomineeDto dto,
            @RequestPart(value = "photo", required = false) MultipartFile photo
    ) throws IOException {
        return ResponseEntity.ok(service.update(id, dto, photo));
    }

    @DeleteMapping("/{id}") // delete nominee by ID
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Serve nominee photo bytes with correct Content-Type
    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> photo(@PathVariable Long id) {
        Nominee n = service.get(id);
        if (n.getPhoto() == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE,
                        n.getPhotoContentType() != null ? n.getPhotoContentType() : MediaType.IMAGE_JPEG_VALUE)
                .body(n.getPhoto());
    }
}
