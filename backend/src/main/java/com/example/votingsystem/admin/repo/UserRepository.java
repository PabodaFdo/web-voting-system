package com.example.votingsystem.admin.repo;

import com.example.votingsystem.admin.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {
    // Get a user by username
    Optional<User> findByUsername(String username);
    // Check if a username is already taken
    boolean existsByUsername(String username);
}
