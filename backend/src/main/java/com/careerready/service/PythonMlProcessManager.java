package com.careerready.service;

import com.careerready.config.PythonMlConfig;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class PythonMlProcessManager {

    private final PythonMlConfig pythonMlConfig;
    private final PythonMlService pythonMlService;

    private Process pythonProcess;
    private boolean startedBySpringBoot = false;

    @PostConstruct
    public void autoStartPythonMlService() {
        if (!pythonMlConfig.isAutoStart()) {
            log.info("Python ML auto-start is disabled via configuration.");
            return;
        }

        // 1. Check if the ML service is already running
        if (pythonMlService.isServiceHealthy()) {
            log.info("Python ML service is already running and healthy on {}. Skipping auto-start.",
                    pythonMlConfig.getMlServiceUrl());
            return;
        }

        log.info("Python ML service is not running. Launching automatically from Spring Boot...");

        // 2. Locate ml-service directory
        File mlDir = locateMlServiceDirectory();
        if (mlDir == null || !new File(mlDir, "app.py").exists()) {
            log.error("Could not locate ml-service directory or app.py. Please verify ml-service folder exists.");
            return;
        }

        log.info("Resolved ml-service directory at: {}", mlDir.getAbsolutePath());

        // 3. Start Python process
        boolean started = launchProcess(mlDir);
        if (!started) {
            log.error("Failed to launch Python ML process.");
            return;
        }

        // 4. Wait for /health endpoint to become UP
        boolean isHealthy = waitForServiceReady(15);
        if (isHealthy) {
            startedBySpringBoot = true;
            long pid = pythonProcess != null ? pythonProcess.pid() : -1;
            log.info("==================================================================");
            log.info("✅ Python Flask ML microservice started automatically (PID: {})", pid);
            log.info("   Endpoint: {}/predict", pythonMlConfig.getMlServiceUrl());
            log.info("==================================================================");
        } else {
            log.error("Python ML service was launched but failed to become healthy within 15 seconds.");
            logLastLogLines(new File(mlDir, "ml-service.log"));
        }
    }

    private File locateMlServiceDirectory() {
        List<File> candidates = Arrays.asList(
                new File("../ml-service"),
                new File("ml-service"),
                new File(System.getProperty("user.dir"), "ml-service"),
                new File(new File(System.getProperty("user.dir")).getParentFile(), "ml-service"),
                new File("i:/Readiness 1/ml-service")
        );

        for (File candidate : candidates) {
            if (candidate.exists() && new File(candidate, "app.py").exists()) {
                try {
                    return candidate.getCanonicalFile();
                } catch (IOException e) {
                    return candidate.getAbsoluteFile();
                }
            }
        }
        return null;
    }

    private boolean launchProcess(File mlDir) {
        String commandsConfig = pythonMlConfig.getPythonCmd();
        List<String> candidateCommands = new ArrayList<>();
        if (commandsConfig != null && !commandsConfig.isBlank()) {
            for (String cmd : commandsConfig.split(",")) {
                candidateCommands.add(cmd.trim());
            }
        } else {
            candidateCommands.add("py -3.13");
            candidateCommands.add("python");
            candidateCommands.add("py");
        }

        File logFile = new File(mlDir, "ml-service.log");

        for (String cmdString : candidateCommands) {
            try {
                List<String> commandList = new ArrayList<>();
                String[] parts = cmdString.split("\\s+");
                commandList.addAll(Arrays.asList(parts));
                commandList.add("app.py");

                ProcessBuilder pb = new ProcessBuilder(commandList);
                pb.directory(mlDir);
                pb.redirectErrorStream(true);
                pb.redirectOutput(ProcessBuilder.Redirect.appendTo(logFile));

                log.info("Attempting to start Python ML service with command: {} in {}", commandList, mlDir.getAbsolutePath());
                pythonProcess = pb.start();

                // Give process 1 second to see if it immediately crashes
                Thread.sleep(1000);
                if (pythonProcess.isAlive()) {
                    return true;
                } else {
                    int exitCode = pythonProcess.exitValue();
                    log.warn("Command '{}' exited immediately with code {}. Trying next candidate...", cmdString, exitCode);
                }
            } catch (Exception e) {
                log.warn("Failed to execute command candidate '{}': {}", cmdString, e.getMessage());
            }
        }
        return false;
    }

    private boolean waitForServiceReady(int maxSeconds) {
        log.info("Waiting for Python ML service to respond on {}/health...", pythonMlConfig.getMlServiceUrl());
        for (int i = 0; i < maxSeconds * 2; i++) {
            if (pythonMlService.isServiceHealthy()) {
                return true;
            }
            if (pythonProcess != null && !pythonProcess.isAlive()) {
                log.error("Python ML process terminated prematurely with exit code: {}", pythonProcess.exitValue());
                return false;
            }
            try {
                Thread.sleep(500);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return false;
    }

    private void logLastLogLines(File logFile) {
        if (!logFile.exists()) return;
        try {
            List<String> lines = Files.readAllLines(Paths.get(logFile.getAbsolutePath()));
            int start = Math.max(0, lines.size() - 20);
            log.error("Last output from ml-service.log:");
            for (int i = start; i < lines.size(); i++) {
                log.error("  [Python ML] {}", lines.get(i));
            }
        } catch (Exception ignored) {
        }
    }

    @PreDestroy
    public void stopPythonMlService() {
        if (startedBySpringBoot && pythonProcess != null && pythonProcess.isAlive()) {
            log.info("Stopping Python ML microservice child process (PID: {})...", pythonProcess.pid());
            try {
                pythonProcess.descendants().forEach(ProcessHandle::destroyForcibly);
                pythonProcess.destroyForcibly();
                log.info("Python ML microservice stopped cleanly.");
            } catch (Exception e) {
                log.warn("Error stopping Python ML microservice: {}", e.getMessage());
            }
        }
    }
}
