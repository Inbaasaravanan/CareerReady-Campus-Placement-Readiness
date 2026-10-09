package com.careerready;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.net.InetSocketAddress;
import java.net.Socket;

@SpringBootApplication
@EnableJpaAuditing
public class CareerReadyApplication {

    private static final Logger log = LoggerFactory.getLogger(CareerReadyApplication.class);

    public static void main(String[] args) {
        ensureMySqlRunning();
        SpringApplication.run(CareerReadyApplication.class, args);
    }

    /**
     * Checks if MySQL database is active on port 3306.
     * If stopped on Windows, automatically attempts to start the MySQL service
     * so running `mvn spring-boot:run` connects to MySQL seamlessly in one command.
     */
    private static void ensureMySqlRunning() {
        if (isMySqlListening("localhost", 3306)) {
            log.info("MySQL connection verified on localhost:3306. Connecting Spring Boot backend...");
            return;
        }

        log.warn("MySQL port 3306 is not open. Automatically attempting to start MySQL service...");
        String os = System.getProperty("os.name", "").toLowerCase();
        if (os.contains("win")) {
            try {
                // Try starting MySQL80 Windows Service
                Process process = new ProcessBuilder("powershell.exe", "-NoProfile", "-Command",
                        "Start-Service -Name MySQL80 -ErrorAction SilentlyContinue; if ((Get-Service -Name MySQL80 -ErrorAction SilentlyContinue).Status -ne 'Running') { Start-Process net -ArgumentList 'start MySQL80' -Verb RunAs -Wait }")
                        .redirectErrorStream(true)
                        .start();
                process.waitFor();

                // Wait up to 10 seconds for MySQL to be ready
                for (int i = 0; i < 10; i++) {
                    if (isMySqlListening("localhost", 3306)) {
                        log.info("MySQL service successfully started on localhost:3306!");
                        return;
                    }
                    Thread.sleep(1000);
                }
            } catch (Exception e) {
                log.warn("Could not automatically start MySQL service: {}", e.getMessage());
            }
        }

        if (!isMySqlListening("localhost", 3306)) {
            log.error("WARNING: MySQL is not running on localhost:3306. Please ensure MySQL service is started.");
        }
    }

    private static boolean isMySqlListening(String host, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 1000);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
