@echo off
title CareerReady AI Launcher
echo ========================================================
echo    CAREERREADY AI - ALL SERVICES LAUNCHER
echo ========================================================
echo [1/2] Launching Spring Boot Backend (Port 8080)...
echo       (Spring Boot will automatically launch Python ML Microservice on Port 5000)
start "CareerReady Backend" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

echo [2/2] Launching React + Vite Frontend (Port 5173)...
start "CareerReady Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ========================================================
echo All services launched in separate windows!
echo - Spring Boot Backend: http://localhost:8080/api
echo - Swagger API Docs:    http://localhost:8080/swagger-ui/index.html
echo - React Frontend:      http://localhost:5173
echo - Python ML Service:   http://localhost:5000 (auto-managed)
echo ========================================================
pause
