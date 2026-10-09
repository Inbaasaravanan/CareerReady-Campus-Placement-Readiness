package com.careerready.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseStartupValidator {

    private final DataSource dataSource;

    @EventListener(ApplicationReadyEvent.class)
    public void validateDatabaseConnectionOnStartup() {
        String dbName = "career_ready_db";
        try (Connection conn = dataSource.getConnection()) {
            String catalog = conn.getCatalog();
            if (catalog != null && !catalog.isBlank()) {
                dbName = catalog;
            }
            log.info("\n" +
                    "==================================================\n" +
                    "CareerReady AI Backend Started\n" +
                    "Database: {}\n" +
                    "Database connection: SUCCESS\n" +
                    "Server running on: http://localhost:8080\n" +
                    "==================================================", dbName);
        } catch (Exception ex) {
            log.error("\n" +
                    "==================================================\n" +
                    "CareerReady AI Backend Startup Error\n" +
                    "Database: {}\n" +
                    "Database connection: FAILED\n" +
                    "Reason: {}\n" +
                    "==================================================", dbName, ex.getMessage());
        }
    }
}
