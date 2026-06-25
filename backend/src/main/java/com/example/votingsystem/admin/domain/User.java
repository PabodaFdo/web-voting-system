package com.example.votingsystem.admin.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Entity   // JPA entity mapped to a table
@Getter
@Setter
@Table(name = "users", uniqueConstraints = @UniqueConstraint(name="uk_user_username", columnNames = "username"))
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Column(nullable=false, length=80)
    private String username;

    @NotBlank @Column(nullable=false)
    private String passwordHash;

    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    private Role role;

    public User() {}
    public User(String username, String passwordHash, Role role) {
        this.username = username; this.passwordHash = passwordHash; this.role = role;
    }
}
