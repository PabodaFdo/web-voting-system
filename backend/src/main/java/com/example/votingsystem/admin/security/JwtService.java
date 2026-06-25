package com.example.votingsystem.admin.security;

import com.example.votingsystem.admin.domain.Role;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

// Makes and verifies JWT tokens
@Service
public class JwtService {
    private final Key key; // Secret key for signing tokens
    public JwtService(@Value("${app.jwt.secret:dev-secret-change-me-please-dev-secret-change-me}") String secret){
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    // Create a JWT with username, role, and expiry (ttlSeconds)
    public String generate(String username, Role role, long ttlSeconds){
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(username)    // who the token is for
                .addClaims(Map.of("role", role.name()))   // store role in token
                .setIssuedAt(Date.from(now))   // issued time
                .setExpiration(Date.from(now.plusSeconds(ttlSeconds)))   // expiry time
                .signWith(key, SignatureAlgorithm.HS256)   // sign with secret key
                .compact();   // build token string
    }

    // Validate and read a JWT (throws if invalid/expired)
    public Jws<Claims> parse(String token){
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
    }
}
