package com.careerready.controller;

import com.careerready.dto.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
@Tag(name = "Health", description = "Backend system and database connection health check")
public class HealthController {

    private final DataSource dataSource;

    @GetMapping
    @Operation(summary = "Check Backend Health", description = "Verifies Spring Boot backend runtime and MySQL database connectivity")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        boolean dbConnected = false;
        String dbName = "career_ready_db";
        try (Connection connection = dataSource.getConnection()) {
            dbConnected = connection.isValid(2);
            if (connection.getCatalog() != null && !connection.getCatalog().isBlank()) {
                dbName = connection.getCatalog();
            }
        } catch (Exception ignored) {
            dbConnected = false;
        }

        Map<String, Object> details = new HashMap<>();
        details.put("database", dbName);
        details.put("status", dbConnected ? "UP" : "DOWN");

        if (dbConnected) {
            return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                    .success(true)
                    .message("Backend and database are connected")
                    .data(details)
                    .build());
        } else {
            return ResponseEntity.status(503).body(ApiResponse.<Map<String, Object>>builder()
                    .success(false)
                    .message("Database connection failed")
                    .data(details)
                    .build());
        }
    }
}
