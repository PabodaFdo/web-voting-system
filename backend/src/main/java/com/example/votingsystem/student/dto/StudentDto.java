package com.example.votingsystem.student.dto;

import com.example.votingsystem.student.domain.Gender;
import com.example.votingsystem.student.domain.Student;

public record StudentDto(
        Long id,
        String indexNo,
        String fullName,
        String email,
        boolean active,
        Gender gender
) {
    public static StudentDto from(Student s) {
        return new StudentDto(
                s.getId(),
                s.getIndexNo(),
                s.getFullName(),
                s.getEmail(),
                s.isActive(),
                s.getGender()
        );
    }
}
