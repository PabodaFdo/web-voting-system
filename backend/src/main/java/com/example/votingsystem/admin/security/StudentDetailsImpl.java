package com.example.votingsystem.admin.security;

import com.example.votingsystem.admin.domain.Role;
import com.example.votingsystem.student.domain.Student;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;

// Bridges Student entity to Spring Security's UserDetails (role = STUDENT)
public record StudentDetailsImpl(Student student) implements org.springframework.security.core.userdetails.UserDetails {
    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + Role.STUDENT.name())); // always ROLE_STUDENT
    }
    @Override public String getPassword() { return student.getPasswordHash(); }  // hashed password from Student
    @Override public String getUsername() { return student.getIndexNo(); } // username shown as indexNo
    @Override public boolean isAccountNonExpired() { return true; }  // no expiry logic
    @Override public boolean isAccountNonLocked() { return student.isActive(); }// locked if not active
    @Override public boolean isCredentialsNonExpired() { return true; }  // no credential expiry
    @Override public boolean isEnabled() { return student.isActive(); }  // enabled only when active
}
