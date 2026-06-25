package com.example.votingsystem.student.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// Student table/entity
@Setter
@Getter
@Entity
@Table(name = "students")
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // auto ID

    @NotBlank
    @Column(name = "index_no", nullable = false, unique = true)
    private String indexNo; // unique student index number

    @NotBlank
    @Column(name = "full_name", nullable = false)
    private String fullName; // student's full name

    @Email
    @NotBlank
    @Column(name = "email", nullable = false, unique = true)
    private String email; // unique email

    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    private String passwordHash; // hashed password (hidden in JSON)

    @Column(name = "active", nullable = false)
    private boolean active = true; // can the student log in/use system

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now(); // when the record was created

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Gender gender = Gender.PREFER_NOT_TO_SAY; // gender choice (defaults to prefer not to say)
}
