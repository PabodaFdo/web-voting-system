package com.example.votingsystem.admin.security;

import com.example.votingsystem.admin.repo.UserRepository;
import com.example.votingsystem.student.repo.StudentRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/**
 * Single entry point for authentication lookups.
 * Tries admin/organizer users by username, then students by indexNo or email.
 */
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository userRepo;
    private final StudentRepository studentRepo;

    public UserDetailsServiceImpl(UserRepository userRepo, StudentRepository studentRepo) {
        this.userRepo = userRepo; this.studentRepo = studentRepo;
    }

    @Override
    public UserDetails loadUserByUsername(String input) throws UsernameNotFoundException {
        // 1) Admin/Organizer users (username)
        var adminUser = userRepo.findByUsername(input).map(UserDetailsImpl::new);
        if (adminUser.isPresent()) return adminUser.get();

        // 2) Students (accept indexNo or email)
        var byIndex = studentRepo.findByIndexNo(input).map(StudentDetailsImpl::new);
        if (byIndex.isPresent()) return byIndex.get();

        var byEmail = studentRepo.findByEmail(input).map(StudentDetailsImpl::new);
        if (byEmail.isPresent()) return byEmail.get();

        throw new UsernameNotFoundException("User not found: " + input);
    }
}
