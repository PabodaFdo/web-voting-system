package com.example.votingsystem.common;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// Global error handler: converts exceptions into JSON { "message": ... } with proper HTTP status
@RestControllerAdvice
public class GlobalErrorHandler {

    // 400 Bad Request for validation/argument errors
    @ExceptionHandler({ MethodArgumentNotValidException.class, BindException.class, IllegalArgumentException.class })
    public ResponseEntity<Map<String,String>> badRequest(Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", rootMessage(e)));
    }

    // 409 Conflict for DB unique/constraint errors (e.g., duplicate email/indexNo)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String,String>> conflict(Exception e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "IndexNo or Email already exists"));
    }

    // 500 Internal Server Error for anything else (last resort)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String,String>> serverError(Exception e) {
        // last resort — keep log clean but inform client
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", rootMessage(e)));
    }

    // Get the deepest cause message; fallback to exception class name if message is blank
    private String rootMessage(Throwable t) {
        Throwable r = t;
        while (r.getCause()!=null) r = r.getCause();
        String m = r.getMessage();
        return (m==null||m.isBlank()) ? t.getClass().getSimpleName() : m;
    }
}
