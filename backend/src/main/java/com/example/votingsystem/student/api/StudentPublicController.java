package com.example.votingsystem.student.api;

import com.example.votingsystem.student.domain.Gender;
import com.example.votingsystem.student.domain.Student;
import com.example.votingsystem.student.dto.PublicRegisterStudentRequest;
import com.example.votingsystem.student.repo.StudentRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

// Public endpoint to register a student account
@RestController
@RequestMapping("/api/public/students")
@RequiredArgsConstructor
public class StudentPublicController {

    private final StudentRepository repo;   // DB access for students
    private final PasswordEncoder encoder;  // hashes passwords

    @PostMapping("/register")
    @Transactional
    public Map<String, String> register(@Valid @RequestBody PublicRegisterStudentRequest req) {
        // Reject if email already exists (409)
        if (repo.existsByEmailIgnoreCase(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
        // Reject if index number already exists (409)
        if (repo.existsByIndexNoIgnoreCase(req.indexNo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Index number already exists");
        }

        // Create new student (inactive until approved)
        Student s = new Student();
        s.setIndexNo(req.indexNo());
        s.setFullName(req.fullName());
        s.setEmail(req.email().toLowerCase());          // store email in lowercase
        s.setPasswordHash(encoder.encode(req.password())); // hash the password
        s.setActive(false); // PENDING approval
        if (req.gender() != null) s.setGender(req.gender()); else s.setGender(Gender.PREFER_NOT_TO_SAY);

        repo.save(s); // persist to DB

        // Simple success message
        return Map.of("message", "Registration submitted. Please wait for admin approval.");
    }
}
