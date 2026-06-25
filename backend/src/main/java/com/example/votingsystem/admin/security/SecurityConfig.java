package com.example.votingsystem.admin.security;

import com.example.votingsystem.admin.repo.UserRepository;
import com.example.votingsystem.student.repo.StudentRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }  // hash passwords (BCrypt)

    // Composite UDS (admins + students)
    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository,
                                                 StudentRepository studentRepository) {
        return new UserDetailsServiceImpl(userRepository, studentRepository);   // load users from both tables
    }

    @Bean
    public DaoAuthenticationProvider authProvider(UserDetailsService uds, PasswordEncoder encoder){
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(uds);           // OK to use deprecated setter on Spring 6.x
        p.setPasswordEncoder(encoder);           // check BCrypt hashes
        return p;
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();  // Spring-provided auth manager
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtService jwt,
            UserDetailsService uds,
            DaoAuthenticationProvider authProvider
    ) throws Exception {

        // IMPORTANT: JwtAuthFilter must know how to map roles to ROLE_*
        // e.g., in the filter: new SimpleGrantedAuthority("ROLE_" + roleName)
        JwtAuthFilter jwtFilter = new JwtAuthFilter(jwt, uds);

        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())     // allow frontends (Vite ports)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        // Let React see 401/403 instead of generic HTML
                        .authenticationEntryPoint((req, res, e) -> res.sendError(401, "Unauthorized"))
                        .accessDeniedHandler((req, res, e) -> res.sendError(403, "Forbidden"))
                )
                .authenticationProvider(authProvider)
                .authorizeHttpRequests(reg -> reg
                        // Public/auth
                        .requestMatchers("/", "/api/auth/**", "/api/public/**", "/h2-console/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public GETs (not the dashboard)
                        .requestMatchers(HttpMethod.GET,
                                "/api/events/**",
                                "/api/categories/**",
                                "/api/nominees/**"
                        ).permitAll()

                        // Voting
                        .requestMatchers(HttpMethod.GET, "/api/vote/category/*/results")
                        .hasAnyRole("STUDENT","ADMIN","ORGANIZER")
                        .requestMatchers("/api/vote/**").hasRole("STUDENT")

                        // Admin/Organizer writes
                        .requestMatchers(HttpMethod.POST,   "/api/nominees/**", "/api/categories/**", "/api/events/**")
                        .hasAnyRole("ADMIN","ORGANIZER")
                        .requestMatchers(HttpMethod.PUT,    "/api/nominees/**", "/api/categories/**", "/api/events/**")
                        .hasAnyRole("ADMIN","ORGANIZER")
                        .requestMatchers(HttpMethod.PATCH,  "/api/nominees/**", "/api/categories/**", "/api/events/**")
                        .hasAnyRole("ADMIN","ORGANIZER")
                        .requestMatchers(HttpMethod.DELETE, "/api/nominees/**", "/api/categories/**", "/api/events/**")
                        .hasAnyRole("ADMIN","ORGANIZER")

                        // Admin only
                        .requestMatchers("/api/students/**").hasRole("ADMIN")
                        .requestMatchers("/api/notifications/**").hasRole("ADMIN")
                        .requestMatchers("/api/dashboard/**").hasRole("ADMIN")
                        .requestMatchers("/api/results/**").hasRole("ADMIN")

                        .requestMatchers("/api/itc/**").hasRole("IT_COORDINATOR")

                        .requestMatchers("/api/public/students/**").permitAll()

                        .requestMatchers("/api/auth/forgot", "/api/auth/reset").permitAll()

                        .anyRequest().authenticated()
                );

        // H2 console frames (dev)
        http.headers(h -> h.frameOptions(f -> f.sameOrigin()));

        // JWT auth before username/password filter
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // CORS for Vite apps (5174 admin, 5177 dashboard, etc.)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(allowedOrigins);
        cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization","Content-Type"));
        cfg.setExposedHeaders(List.of("Authorization"));   // if you ever read it client-side
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
