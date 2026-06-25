package com.example.votingsystem.admin.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, Long> {
    Optional<PasswordReset> findTopByStudentIdAndUsedAtIsNullOrderByIdDesc(Long studentId);
    void deleteByStudentId(Long studentId); // optional cleanup
}
