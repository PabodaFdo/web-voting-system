package com.example.votingsystem.student.api;

import com.example.votingsystem.student.domain.Gender;
import com.example.votingsystem.student.domain.Student;
import com.example.votingsystem.student.repo.StudentRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@PreAuthorize("hasRole('ADMIN')") // ADMIN only
public class StudentAdminController {

    private final StudentRepository repo;
    private final PasswordEncoder encoder;

    public StudentAdminController(StudentRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    // ===== Request DTOs (only change is Gender added) =====
    public record CreateStudentReq(
            @NotBlank String indexNo,
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @NotBlank String rawPassword,
            Boolean active,
            String password,          // keep if your UI used it; ignored
            Gender gender              // ✅ added
    ) {}

    public record UpdateStudentReq(
            String fullName,
            @Email String email,
            String rawPassword,
            Boolean active,
            String password,          // keep if your UI used it; ignored
            Gender gender              // ✅ added
    ) {}

    // ===== Error shortcuts (unchanged pattern) =====
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    static class BadRequestException extends RuntimeException { BadRequestException(String m){super(m);} }
    @ResponseStatus(HttpStatus.NOT_FOUND)
    static class NotFoundException extends RuntimeException { NotFoundException(String m){super(m);} }
    @ResponseStatus(HttpStatus.CONFLICT)
    static class ConflictException extends RuntimeException { ConflictException(String m){super(m);} }

    // ===== CRUD =====
    @GetMapping
    public List<Student> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public Student get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Student not found"));
    }

    @PostMapping
    @Transactional
    public Student create(@Valid @RequestBody CreateStudentReq req) {
        // duplicates guarded by unique constraints as well
        if (repo.findByEmail(req.email()).isPresent())
            throw new ConflictException("Email already exists");
        if (repo.findByIndexNo(req.indexNo()).isPresent())
            throw new ConflictException("Index number already exists");

        Student s = new Student();
        s.setIndexNo(req.indexNo());
        s.setFullName(req.fullName());
        s.setEmail(req.email());
        s.setActive(req.active() == null ? true : req.active());
        s.setPasswordHash(encoder.encode(req.rawPassword()));
        s.setGender(req.gender() == null ? Gender.PREFER_NOT_TO_SAY : req.gender()); // ✅ save gender

        try {
            return repo.save(s);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Duplicate index or email");
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public Student update(@PathVariable Long id, @RequestBody UpdateStudentReq req) {
        Student s = repo.findById(id).orElseThrow(() -> new NotFoundException("Student not found"));

        if (req.fullName() != null) s.setFullName(req.fullName());
        if (req.email() != null)    s.setEmail(req.email());
        if (req.active() != null)   s.setActive(req.active());
        if (req.rawPassword() != null && !req.rawPassword().isBlank())
            s.setPasswordHash(encoder.encode(req.rawPassword()));
        if (req.gender() != null)   s.setGender(req.gender()); // ✅ update gender if provided

        try {
            return repo.save(s);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Duplicate index or email");
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repo.existsById(id)) throw new NotFoundException("Student not found");
        repo.deleteById(id);
    }
}
