package com.example.votingsystem.admin.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// JWT filter: checks Authorization header, validates token, sets SecurityContext
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;  // Parses/validates JWT
    private final UserDetailsService userDetailsService;  // Loads user details from DB

    public JwtAuthFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String header = req.getHeader(HttpHeaders.AUTHORIZATION);
        // If no "Bearer ..." header → skip auth and continue
        if (!StringUtils.hasText(header) || !header.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }

        String token = header.substring(7); // remove "Bearer "
        try {
            Claims claims = jwtService.parse(token).getBody(); // validate + read claims
            String username = claims.getSubject();  // who is the user
            String role = claims.get("role", String.class); // "STUDENT", "ADMIN", ...

            // Only set auth if none exists yet
            if (StringUtils.hasText(username) &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails details = null;
                try {
                    details = userDetailsService.loadUserByUsername(username);  // try DB-backed user
                } catch (Exception ignored) {
                    // fall back to claims only
                }

                // Authorities: from DB if available, else from token role (prefixed with ROLE_)
                var authorities = (details != null)
                        ? details.getAuthorities()
                        : List.of(new SimpleGrantedAuthority(
                        role != null && role.startsWith("ROLE_") ? role : "ROLE_" + role));

                // Principal: full UserDetails if loaded, else just username string
                var principal = (details != null) ? details : username;

                // Create authenticated token and place in security context
                var auth = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception ignored) {
            // invalid/expired token -> continue unauthenticated
        }

        chain.doFilter(req, res);  // continue to next filter/controller
    }
}
