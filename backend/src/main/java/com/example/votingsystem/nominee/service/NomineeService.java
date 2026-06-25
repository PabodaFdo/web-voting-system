package com.example.votingsystem.nominee.service;

import com.example.votingsystem.nominee.dto.NomineeDto;
import com.example.votingsystem.nominee.entity.Category;
import com.example.votingsystem.nominee.entity.Nominee;
import com.example.votingsystem.nominee.repository.CategoryRepository;
import com.example.votingsystem.nominee.repository.NomineeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@Transactional
public class NomineeService {

    private final NomineeRepository nomineeRepo;     // DB access for nominees
    private final CategoryRepository categoryRepo;   // DB access for categories

    public NomineeService(NomineeRepository nomineeRepo, CategoryRepository categoryRepo) {
        this.nomineeRepo = nomineeRepo;
        this.categoryRepo = categoryRepo;
    }

    public List<Nominee> findAll() {                 // get all nominees
        return nomineeRepo.findAll();
    }

    public List<Nominee> findByCategory(Long categoryId) { // get nominees by category
        return nomineeRepo.findByCategory_Id(categoryId);
    }

    public Nominee get(Long id) {                    // get one nominee
        return nomineeRepo.findById(id).orElseThrow();
    }

    public Nominee create(NomineeDto dto, MultipartFile photo) throws IOException { // create with optional photo
        Nominee n = new Nominee();
        applyDto(n, dto);                            // copy fields from DTO
        applyPhoto(n, photo);                        // set photo bytes/type if provided
        return nomineeRepo.save(n);
    }

    public Nominee update(Long id, NomineeDto dto, MultipartFile photo) throws IOException { // update nominee
        Nominee n = nomineeRepo.findById(id).orElseThrow();
        applyDto(n, dto);
        applyPhoto(n, photo);
        return nomineeRepo.save(n);
    }

    public void delete(Long id) {                    // delete nominee
        nomineeRepo.deleteById(id);
    }

    // --- helpers ---
    private void applyDto(Nominee n, NomineeDto dto) { // map DTO to entity
        if (dto.name() != null) n.setName(dto.name());
        n.setBio(dto.bio());
        if (dto.categoryId() != null) {
            Category category = categoryRepo.findById(dto.categoryId()).orElseThrow();
            n.setCategory(category);                 // link to category
        }
    }

    private void applyPhoto(Nominee n, MultipartFile photo) throws IOException { // handle photo upload
        if (photo != null && !photo.isEmpty()) {
            n.setPhoto(photo.getBytes());            // store bytes
            n.setPhotoContentType(photo.getContentType()); // store MIME type
        }
    }
}
