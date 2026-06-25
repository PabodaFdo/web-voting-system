package com.example.votingsystem.student.api;

import com.example.votingsystem.student.domain.Student;
import com.example.votingsystem.student.dto.StudentDto;
import com.example.votingsystem.student.repo.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/students")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StudentApprovalAdminController {

    private final StudentRepository repo;

    @GetMapping("/pending")
    public List<StudentDto> pending() {
        return repo.findByActiveFalse()
                .stream().map(StudentDto::from).toList();
    }

    @PatchMapping("/{id}/activate")
    @Transactional
    public StudentDto activate(@PathVariable Long id) {
        Student s = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        s.setActive(true);
        return StudentDto.from(repo.save(s));
    }
}
